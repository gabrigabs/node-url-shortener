import { Request, Response, NextFunction } from 'express';
import { HttpLoggerMiddleware } from '../../../src/common/middlewares/http-logger.middleware';
import { Logger } from 'winston';

interface RequestWithId extends Request {
  requestId?: string;
}

describe('HttpLoggerMiddleware', () => {
  let middleware: HttpLoggerMiddleware;
  let mockLogger: jest.Mocked<Logger>;
  let mockRequest: Partial<RequestWithId>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    middleware = new HttpLoggerMiddleware(mockLogger);

    mockRequest = {
      method: 'GET',
      originalUrl: '/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    };

    mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn().mockReturnThis(),
      statusCode: 200,
    };

    mockNext = jest.fn();
  });

  describe('use', () => {
    it('deve adicionar requestId à requisição', () => {
      middleware.use(
        mockRequest as RequestWithId,
        mockResponse as Response,
        mockNext,
      );

      expect(mockRequest.requestId).toBeDefined();
      expect(typeof mockRequest.requestId).toBe('string');
    });

    it('deve adicionar header X-Request-Id na resposta', () => {
      middleware.use(
        mockRequest as RequestWithId,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'X-Request-Id',
        expect.any(String),
      );
    });

    it('deve logar a requisição recebida', () => {
      middleware.use(
        mockRequest as RequestWithId,
        mockResponse as Response,
        mockNext,
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Requisição recebida',
        expect.objectContaining({
          context: 'HttpLoggerMiddleware',
          requestId: expect.any(String) as string,
          method: 'GET',
          url: '/test',
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        }),
      );
    });

    it('deve usar "unknown" quando user-agent não está presente', () => {
      mockRequest.headers = {};

      middleware.use(
        mockRequest as RequestWithId,
        mockResponse as Response,
        mockNext,
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Requisição recebida',
        expect.objectContaining({
          userAgent: 'unknown',
        }),
      );
    });

    it('deve chamar next()', () => {
      middleware.use(
        mockRequest as RequestWithId,
        mockResponse as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('deve logar requisição concluída com nível info para status 200', () => {
      middleware.use(
        mockRequest as RequestWithId,
        mockResponse as Response,
        mockNext,
      );

      const originalSend = mockResponse.send as jest.Mock;
      mockResponse.statusCode = 200;

      originalSend.call(mockResponse, { data: 'test' });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Requisição concluída',
        expect.objectContaining({
          context: 'HttpLoggerMiddleware',
          method: 'GET',
          url: '/test',
          statusCode: 200,
          duration: expect.stringContaining('ms') as string,
        }),
      );
    });

    it('deve logar requisição concluída com nível warn para status 400', () => {
      middleware.use(
        mockRequest as RequestWithId,
        mockResponse as Response,
        mockNext,
      );

      const originalSend = mockResponse.send as jest.Mock;
      mockResponse.statusCode = 400;

      originalSend.call(mockResponse, { error: 'Bad Request' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Requisição concluída',
        expect.objectContaining({
          statusCode: 400,
        }),
      );
    });

    it('deve logar requisição concluída com nível error para status 500', () => {
      middleware.use(
        mockRequest as RequestWithId,
        mockResponse as Response,
        mockNext,
      );

      const originalSend = mockResponse.send as jest.Mock;
      mockResponse.statusCode = 500;

      originalSend.call(mockResponse, { error: 'Internal Server Error' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Requisição concluída',
        expect.objectContaining({
          statusCode: 500,
        }),
      );
    });
  });
});
