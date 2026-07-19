import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

interface ErrorEnvelope {
  statusCode: number;
  success: false;
  message: string;
  error: string;
  details?: unknown;
}

/**
 * Normalizes every error to a consistent envelope:
 * `{ statusCode, success: false, message, error, details? }`.
 * Handles HttpException, Mongoose (ValidationError / CastError / E11000), and unknowns.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        const body = res as { message?: string | string[]; error?: string };
        if (Array.isArray(body.message)) {
          message = body.message[0]; // first validation error
          details = body.message; // full list of field errors
        } else {
          message = body.message ?? body.error ?? message;
        }
      }
    } else if (this.isMongoDuplicate(exception)) {
      statusCode = HttpStatus.CONFLICT;
      message = 'A record with those details already exists';
    } else if (exception instanceof Error && exception.name === 'ValidationError') {
      statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
      message = exception.message;
    } else if (exception instanceof Error && exception.name === 'CastError') {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Invalid identifier';
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception.stack);
    }

    const envelope: ErrorEnvelope = {
      statusCode,
      success: false,
      message,
      error: HttpStatus[statusCode] ?? 'ERROR',
      ...(details ? { details } : {}),
    };
    response.status(statusCode).json(envelope);
  }

  private isMongoDuplicate(e: unknown): boolean {
    return typeof e === 'object' && e !== null && (e as { code?: number }).code === 11000;
  }
}
