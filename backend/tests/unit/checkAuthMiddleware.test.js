// Define a env var ANTES de importar o middleware para evitar undefined
process.env.JWT_SECRET = 'test-secret';

const checkAuthMiddleware = require('../../src/middleware/checkAuthMiddleware');
const jwt = require('jsonwebtoken');

// Mock do JWT
jest.mock('jsonwebtoken');

// Mocks manuais
const mockRequest = () => ({
  header: jest.fn(),
  user: undefined,
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('CheckAuthMiddleware Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext;
    jest.clearAllMocks();
  });

  it('deve prosseguir sem fazer nada se não houver header Authorization', () => {
    req.header.mockReturnValue(null);

    checkAuthMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
    // Garante que não tentou verificar token
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('deve prosseguir sem fazer nada se o formato do token for inválido (sem Bearer)', () => {
    req.header.mockReturnValue('Basic 123456');

    checkAuthMiddleware(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('deve popular req.user se o token for válido', () => {
    const mockUser = { id: 1, nome: 'Teste' };
    req.header.mockReturnValue('Bearer token-valido');
    jwt.verify.mockReturnValue(mockUser);

    checkAuthMiddleware(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token-valido', 'test-secret');
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it('deve capturar erro de token inválido e prosseguir sem usuário (fail soft)', () => {
    req.header.mockReturnValue('Bearer token-invalido');

    // Simula erro (expirado ou adulterado)
    jwt.verify.mockImplementation(() => {
      throw new Error('Token expired');
    });

    checkAuthMiddleware(req, res, next);

    // O middleware deve engolir o erro e chamar next()
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });
});
