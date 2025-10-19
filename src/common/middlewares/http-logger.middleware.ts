import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { randomUUID } from 'crypto';

interface RequestWithId extends Request {
  requestId?: string;
}

/**
 * Middleware para logging de requisições HTTP
 * Loga início e fim de cada requisição com duração, status code e metadados
 * Também gera o Request ID único para rastreabilidade
 */
@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  use(req: RequestWithId, res: Response, next: NextFunction) {
    const requestId = randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    const { method, originalUrl, ip, headers } = req;
    const userAgent = headers['user-agent'] || 'unknown';
    const startTime = Date.now();

    this.logger.info('Incoming request', {
      context: 'HttpLoggerMiddleware',
      requestId,
      method,
      url: originalUrl,
      ip,
      userAgent,
    });

    const originalSend = res.send;
    const loggerInstance = this.logger;

    res.send = function (body: unknown): Response {
      res.send = originalSend;

      const duration = Date.now() - startTime;
      const { statusCode } = res;
      const level =
        statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

      loggerInstance[level]('Request completed', {
        context: 'HttpLoggerMiddleware',
        requestId,
        method,
        url: originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return originalSend.call(this, body);
    };

    next();
  }
}
