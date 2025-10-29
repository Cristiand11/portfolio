const express = require('express');
const router = express.Router();
const medicoController = require('../controllers/medicoController');
const authMiddleware = require('../middleware/authMiddleware');

const {
  adminAuth,
  adminOuMedicoDonoAuth,
  adminOuPacienteAuth,
  medicoAuth,
  medicoOuAuxiliarAuth,
} = require('../middleware/authorizationMiddleware');

// Rota POST /api/medicos
router.post('/', authMiddleware, medicoController.createMedico);

// Rota para o médico logado buscar seus próprios dados
router.get('/me', authMiddleware, medicoAuth, medicoController.getMe);

// Rota GET Medicos
router.get('/', authMiddleware, adminOuPacienteAuth, medicoController.getAllMedicos);

// Rota PUT para atualizar um médico por ID
router.put('/:id', authMiddleware, adminOuMedicoDonoAuth, medicoController.updateMedico);

// Rota DELETE para remover um médico por ID
router.delete('/:id', authMiddleware, adminOuMedicoDonoAuth, medicoController.deleteMedico);

// Rota POST para um admin solicitar a inativação de um médico por ID
router.post(
  '/:id/solicitar-inativacao',
  authMiddleware,
  adminAuth,
  medicoController.solicitarInativacao
);

// Rota POST para um admin reverter a solicitação de inativação de um médico
router.post(
  '/:id/reverter-inativacao',
  authMiddleware,
  adminAuth,
  medicoController.reverterInativacao
);

// Rota GET para o médico visualizar o histórico de pacientes atendidos
router.get('/me/pacientes', authMiddleware, medicoAuth, medicoController.getPacientesAtendidos);

// Rota GET para o médico visualizar apenas os seus auxiliares
router.get('/me/auxiliares', authMiddleware, medicoAuth, medicoController.getMeusAuxiliares);

// Rota PUT para o médico definir/substituir sua grade de horários de trabalho
router.put('/me/horarios', authMiddleware, medicoAuth, medicoController.definirMeusHorarios);

// Rota GET para o médico visualizar seus horários disponíveis
router.get('/me/horarios', authMiddleware, medicoAuth, medicoController.getMeusHorarios);

// Rota para qualquer usuário logado ver os horários de trabalho de um médico específico
router.get('/:id/horarios', authMiddleware, medicoController.getHorariosByMedicoId);

// Rota GET para o médico ou auxiliar visualizar os pacientes atendidos
router.get(
  '/:id/pacientes',
  authMiddleware,
  medicoOuAuxiliarAuth,
  medicoController.getPacientesByMedicoId
);

// Rota GET para o médico ou auxiliar visualizar as consultas pelo ID do médico
router.get(
  '/:id/consultas',
  authMiddleware,
  medicoOuAuxiliarAuth,
  medicoController.getConsultasByMedicoId
);

module.exports = router;
