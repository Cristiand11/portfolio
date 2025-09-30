require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Importa as rotas
const medicoRoutes = require('./src/routes/medicoRoutes');
const pacienteRoutes = require('./src/routes/pacienteRoutes');
const auxiliarRoutes = require('./src/routes/auxiliarRoutes');
const consultaRoutes = require('./src/routes/consultaRoutes');
const authRoutes = require('./src/routes/authRoutes');
const administradorRoutes = require('./src/routes/administradorRoutes');

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'API de Agendamento Médico funcionando!' });
});

// Utiliza as rotas com prefixo /api
app.use('/api/medicos', medicoRoutes);
app.use('/api/pacientes', pacienteRoutes);
app.use('/api/auxiliares', auxiliarRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/administradores', administradorRoutes);

// Define a porta a partir das variáveis de ambiente ou usa 3001 como padrão
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor rodando na porta ${PORT}`);
});
