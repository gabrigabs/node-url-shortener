import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { GlobalExceptionFilter } from '../../../src/common/filters/global-exception.filter';
import { Logger } from 'winston';

interface RequestWithId extends Request {
  requestId?: string;
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockLogger: jest.Mocked<Logger>;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: Partial<RequestWithId>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    filter = new GlobalExceptionFilter(mockLogger);

    mockRequest = {
      requestId: 'test-request-id',
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  describe('catch', () => {
    it('deve capturar e logar HttpException', () => {
      const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro capturado',
        expect.objectContaining({
          context: 'GlobalExceptionFilter',
          requestId: 'test-request-id',
          method: 'GET',
          url: '/test',
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Not Found',
        }),
      );

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          timestamp: expect.any(String) as string,
          path: '/test',
        }),
      );
    });

    it('deve capturar e logar erro genérico como INTERNAL_SERVER_ERROR', () => {
      const exception = new Error('Generic error');

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro capturado',
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
          error: 'Generic error',
        }),
      );

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        }),
      );
    });

    it('deve usar "no-request-id" quando requestId não está presente', () => {
      mockRequest.requestId = undefined;
      const exception = new HttpException(
        'Bad Request',
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro capturado',
        expect.objectContaining({
          requestId: 'no-request-id',
        }),
      );
    });

    it('deve incluir stack trace para erros', () => {
      const exception = new Error('Test error with stack');

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro capturado',
        expect.objectContaining({
          stack: expect.any(String) as string,
        }),
      );
    });

    it('deve capturar HttpException com objeto de resposta customizado', () => {
      const customResponse = {
        message: 'Validation failed',
        errors: ['Field is required'],
      };
      const exception = new HttpException(
        customResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Validation failed',
          errors: ['Field is required'],
        }),
      );
    });

    it('deve logar informações de IP e user-agent', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro capturado',
        expect.objectContaining({
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        }),
      );
    });

    it('deve converter exceção não-Error para string', () => {
      const exception = 'String error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Erro capturado',
        expect.objectContaining({
          error: 'String error',
          stack: undefined,
        }),
      );
    });
  });
});
