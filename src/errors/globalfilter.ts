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
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle HttpException
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message;
      }
    }
    // Handle Database/TypeORM errors
    else if ((exception as any).code) {
      const dbError = exception as any;

      switch (dbError.code) {
        case '23505': // Unique constraint violation
          status = HttpStatus.CONFLICT;
          message = 'A record with this value already exists';
          break;
        case '23503': // Foreign key violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Referenced record does not exist';
          break;
        case '23502': // Not null violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Required field is missing';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database error occurred';
      }

      this.logger.error(
        `Database error on ${request.method} ${request.url}: ${dbError.message}`,
        dbError.stack,
      );
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message || 'An unexpected error occurred';
      this.logger.error(
        `Error on ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    }

    // Log 5xx errors
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status} - ${message}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );
    }

    // Send response in YOUR existing format
    response.status(status).json({
      statusCode: status,
      message: message,
    });
  }
}
