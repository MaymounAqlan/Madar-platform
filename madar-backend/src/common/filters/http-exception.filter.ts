import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (response.headersSent) {
      this.logger.warn(
        `${request.method} ${request.url} - headers already sent, skipping exception response`,
      );
      return;
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    let errorMessage =
      typeof message === 'object'
        ? (message as any).message || 'An error occurred'
        : message;
    const errorCode =
      typeof message === 'object'
        ? (message as any).code || 'UNKNOWN_ERROR'
        : 'UNKNOWN_ERROR';
    const errorDetails =
      typeof message === 'object' && (message as any).details
        ? (message as any).details
        : undefined;

    if (Array.isArray(errorMessage)) {
      errorMessage = errorMessage.join(', ');
    }

    const errorResponse: any = {
      success: false,
      statusCode: status,
      code: errorCode,
      message: errorMessage,
      data: null,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    };
    if (errorDetails) {
      errorResponse.details = errorDetails;
    }

    // Log validation errors in a sanitized, structured way (no passwords/tokens).
    if (status === HttpStatus.BAD_REQUEST && request.body && typeof request.body === 'object') {
      const sanitizedBody = { ...request.body };
      ['password', 'newPassword', 'accessToken', 'refreshToken', 'token', 'googleToken', 'linkedinToken'].forEach((key) => {
        if (key in sanitizedBody) sanitizedBody[key] = '[REDACTED]';
      });
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - code=${errorCode} - message=${JSON.stringify(errorMessage)} - body=${JSON.stringify(sanitizedBody)} - details=${JSON.stringify(errorDetails)}`,
      );
    } else {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - code=${errorCode} - ${JSON.stringify(errorMessage)}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    response.status(status).json(errorResponse);
  }
}
