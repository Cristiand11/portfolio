const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { getDiasUteis } = require('../utils/dateUtils');
const { enviarEmail } = require('../services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET;

// --- FUNÇÃO PARA REALIZAR O LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, senha, perfil } = req.body;
    if (!email || !senha || !perfil) {
      return res.status(400).json({ message: 'Preencha todos os campos para continuar.' });
    }

    if (perfil.toLowerCase() === 'medico') {
      const medicoResult = await db.query('SELECT * FROM MEDICO WHERE email = $1', [email]);
      if (medicoResult.rows.length > 0) {
        const medico = medicoResult.rows[0];

        if (medico.status === 'Inativo') {
          return res.status(403).json({ message: 'Acesso bloqueado. Sua conta foi inativada.' });
        }

        if (medico.status === 'Aguardando Inativação' && medico.inativacaoSolicitadaEm) {
          const diasUteisPassados = getDiasUteis(medico.inativacaoSolicitadaEm);
          if (diasUteisPassados > 5) {
            await db.query('UPDATE medico SET status = $1, WHERE id = $2', ['Inativo', medico.id]);
            return res.status(403).json({ message: 'Acesso bloqueado. Sua conta foi inativada.' });
          }
        }
      }
    }

    const tabelas = {
      medico: 'MEDICO',
      paciente: 'PACIENTE',
      auxiliar: 'AUXILIAR',
      administrador: 'ADMINISTRADOR',
    };

    const tabela = tabelas[perfil.toLowerCase()];
    if (!tabela) {
      return res.status(400).json({
        message: 'O tipo de perfil informado não é reconhecido. Verifique e tente novamente.',
      });
    }

    const userResult = await db.query(`SELECT * FROM ${tabela} WHERE email = $1`, [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        message: 'E-mail ou senha incorretos. Verifique suas informações e tente novamente.',
      });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(senha, user.senha);
    if (!isMatch) {
      return res.status(401).json({
        message: 'E-mail ou senha incorretos. Verifique suas informações e tente novamente.',
      });
    }

    const payload = { id: user.id, nome: user.nome, perfil: perfil.toLowerCase() };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    res.json({ message: 'Login bem-sucedido!', token });
  } catch (error) {
    res.status(500).json({
      message: 'Ocorreu um problema inesperado. Tente novamente em alguns instantes.',
      error: error.message,
    });
  }
};

// --- FUNÇÃO PARA SOLICITAR A REDEFINIÇÃO DE SENHA ---
exports.forgotPassword = async (req, res) => {
  try {
    const { email, perfil } = req.body;

    const tabelas = {
      medico: 'MEDICO',
      paciente: 'PACIENTE',
      auxiliar: 'AUXILIAR',
      administrador: 'ADMINISTRADOR',
    };

    const tabela = tabelas[perfil.toLowerCase()];
    if (!tabela) return res.status(400).json({ message: 'Perfil inválido.' });

    const userResult = await db.query(`SELECT * FROM ${tabela} WHERE email = $1`, [email]);
    if (userResult.rows.length === 0) {
      // Resposta genérica por segurança, mesmo que o usuário não exista
      return res.status(200).json({
        message:
          'Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.',
      });
    }
    const user = userResult.rows[0];

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora em milissegundos

    await db.query(
      'INSERT INTO PASSWORD_RESET_TOKENS (user_id, perfil, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, perfil.toLowerCase(), tokenHash, expiresAt]
    );

    const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${resetToken}`;
    const assunto = 'Recuperação de Senha - AgendaMed';
    const mensagemHtml = `<p>Você solicitou a redefinição de sua senha. Clique no link a seguir para criar uma nova senha: <a href="${resetUrl}">${resetUrl}</a></p><p>Este link expira em 1 hora.</p>`;

    await enviarEmail({ para: user.email, assunto, mensagemHtml });

    res.status(200).json({
      message:
        'Se um usuário com este e-mail existir, um link de redefinição de senha será enviado.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// --- FUNÇÃO PARA EFETIVAMENTE REDEFINIR A SENHA ---
exports.resetPassword = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenResult = await db.query(
      'SELECT * FROM PASSWORD_RESET_TOKENS WHERE token_hash = $1 AND expires_at > NOW()',
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Token inválido ou expirado.' });
    }
    const tokenData = tokenResult.rows[0];
    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

    const tabelas = {
      medico: 'MEDICO',
      paciente: 'PACIENTE',
      auxiliar: 'AUXILIAR',
      administrador: 'ADMINISTRADOR',
    };
    const tabela = tabelas[tokenData.perfil];
    await db.query(`UPDATE ${tabela} SET senha = $1, "lastModifiedDate" = NOW() WHERE id = $2`, [
      novaSenhaHash,
      tokenData.user_id,
    ]);

    await db.query('DELETE FROM PASSWORD_RESET_TOKENS WHERE id = $1', [tokenData.id]);

    res.status(200).json({ message: 'Senha redefinida com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao redefinir a senha.', error: error.message });
  }
};
