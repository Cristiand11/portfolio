# Sistema de Agendamento Inteligente de Consultas Médicas

## Descrição
O sistema de Agendamento Inteligente de Consultas Médicas é uma plataforma web projetada para facilitar a gestão de consultas entre administradores, médicos, auxiliares e pacientes. O sistema oferece funcionalidades como cadastro e autenticação segura de usuários, gerenciamento de agendas, envio de notificações e acompanhamento de histórico de consultas.

## Tecnologias Utilizadas
- **Front-end:** React.js
- **Back-end:** Node.js com Express
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT (JSON Web Token)
- **Hospedagem:** À definir

---

## 1. Requisitos Funcionais (RF)

### 1.1. Autenticação e Perfis de Usuário
- **RF01** - Cadastro de administradores, médicos, auxiliares e pacientes.
- **RF02** - Exibição de página de seleção de perfil antes do login.
- **RF03** - Um mesmo e-mail pode ser utilizado em múltiplos perfis.
- **RF04** - Login e autenticação segura para todos os usuários.
- **RF05** - Médicos podem cadastrar auxiliares vinculados a eles.
- **RF06** - Administradores podem cadastrar médicos na plataforma.
- **RF07** - Pacientes podem se cadastrar e editar seus dados pessoais.
- **RF08** - Administradores não podem visualizar dados de agendamentos, pacientes ou auxiliares.
- **RF09** - Administradores podem solicitar a inativação de um médico.
- **RF10** - O administrador pode reverter a solicitação de inativação dentro de 5 dias úteis.
- **RF11** - Após 5 dias úteis sem reversão, o login do médico será bloqueado.
- **RF12** - Após o bloqueio, o médico precisará se cadastrar novamente.

### 1.2. Gerenciamento de Médicos e Auxiliares
- **RF13** - Administradores podem visualizar, editar e remover médicos.
- **RF14** - Médicos podem editar seu perfil, informando especialidades e horários.
- **RF15** - Médicos podem cadastrar, editar ou remover auxiliares vinculados ao seu perfil.

### 1.3. Gerenciamento de Agendas e Consultas
- **RF16** - Médicos e auxiliares podem configurar horários disponíveis.
- **RF17** - Pacientes podem solicitar consultas com médicos.
- **RF18** - Auxiliares podem aprovar, cancelar ou remanejar consultas.
- **RF19** - Médicos e auxiliares podem visualizar e gerenciar consultas.
- **RF20** - Pacientes podem cancelar consultas com antecedência configurável.
- **RF21** - O histórico de consultas deve ser registrado.

### 1.4. Notificações e Comunicação
- **RF22** - O sistema deve enviar notificações por e-mail sobre consultas.
- **RF23** - Médicos e auxiliares podem enviar mensagens para pacientes.

### 1.5. Relatórios e Monitoramento
- **RF24** - Administradores podem visualizar relatórios de uso.
- **RF25** - Médicos podem acessar estatísticas da agenda.
- **RF26** - Pacientes podem acessar histórico de consultas.

---

## 2. Requisitos Não Funcionais (RNF)

### 2.1. Tecnologias e Plataforma
- **RNF01** - O sistema deve garantir segurança com criptografia de senhas.
- **RNF02** - Tempo de resposta para login deve ser de até 3 segundos.
- **RNF03** - A aplicação deve ser 100% web, sem suporte para apps móveis.
- **RNF04** - Dados armazenados devem ser protegidos contra alterações não autorizadas.
- **RNF05** - O sistema deve ser hospedado em plataforma gratuita.
- **RNF06** - Compatibilidade garantida com Chrome, Firefox e Edge.
- **RNF07** - A expiração da reversão de inativação deve ser contada em dias úteis.
- **RNF08** - O banco de dados deve ser PostgreSQL.

### 2.2. Desempenho e Escalabilidade
- **RNF09** - O sistema deve suportar pelo menos 500 usuários simultâneos.
- **RNF10** - As páginas devem carregar em até 3 segundos.

### 2.3. Segurança
- **RNF11** - Implementação de autenticação JWT.
- **RNF12** - Hashing de senhas com bcrypt.
- **RNF13** - Proteção contra SQL Injection e XSS.
- **RNF14** - Recuperação de senha via e-mail.

### 2.4. Manutenibilidade e Monitoramento
- **RNF15** - Desenvolvimento modular para manutenção e expansão.
- **RNF16** - Registro de logs de erros e acessos.
- **RNF17** - Uso de versionamento no GitHub.

### 2.5. Usabilidade e Acessibilidade
- **RNF18** - Interface intuitiva e acessível.
- **RNF19** - Suporte a leitores de tela para acessibilidade.

---

## 3. Relacionamentos entre Entidades

### Administrador
- Pode cadastrar médicos, mas não gerencia seus acessos diretamente.

### Médico
- Pode ter vários auxiliares e pacientes associados.

### Auxiliar
- Associado a apenas um médico.
- Pode manejar agenda e documentos do médico.

### Paciente
- Pode ser atendido por vários médicos.
- O primeiro médico cria o registro do paciente.

---

## 4. Fluxo de Telas

### 4.1. Administrador
- Dashboard com indicadores do sistema.
- Tela de cadastros para gerenciar médicos.
- Tela de solicitações para gerenciar inativações.

### 4.2. Médico
- Dashboard com agenda do dia.
- Cadastro de auxiliares e pacientes.
- Gerenciamento de consultas.

---
