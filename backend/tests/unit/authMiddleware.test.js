// --- CORREÇÃO: Definir a variável ANTES de importar o middleware ---
process.env.JWT_SECRET = 'test-secret'; 

const authMiddleware = require('../../src/middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Mock do JsonWebToken
jest.mock('jsonwebtoken');

// Mock manual de Req, Res, Next
const mockRequest = () => ({
  header: jest.fn(),
  user: null
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('AuthMiddleware Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
    jest.clearAllMocks();
    // Não precisamos mais definir o JWT_SECRET aqui pois já foi definido no topo
  });

  it('deve retornar 401 se não houver header Authorization', () => {
    req.header.mockReturnValue(null);

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Acesso negado. Nenhum token fornecido.'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('deve retornar 401 se o token for inválido ou expirado', () => {
    req.header.mockReturnValue('Bearer token-invalido');
    
    // Simula erro no verify
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Token inválido ou expirado.'
    }));
    expect(next).not.toHaveBeenCalled();
  });

  it('deve chamar next() e popular req.user se o token for válido', () => {
    const mockUser = { id: 1, perfil: 'medico' };
    req.header.mockReturnValue('Bearer token-valido');
    
    // Simula sucesso no verify retornando o payload decodificado
    jwt.verify.mockReturnValue(mockUser);

    authMiddleware(req, res, next);

    // Agora o 'process.env.JWT_SECRET' (test-secret) deve bater com o valor interno do middleware
    expect(jwt.verify).toHaveBeenCalledWith('token-valido', 'test-secret');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});