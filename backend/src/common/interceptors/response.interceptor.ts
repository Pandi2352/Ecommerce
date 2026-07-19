import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE } from '../decorators/response-message.decorator';

export interface ApiEnvelope<T> {
  statusCode: number;
  success: true;
  message: string;
  data: T;
  meta?: unknown;
}

/**
 * Wraps every successful response in a consistent envelope:
 * `{ statusCode, success: true, message, data, meta? }`.
 * If a handler returns `{ data, meta }` (paginated lists), those are used directly.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiEnvelope<unknown>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<unknown>> {
    const res = context.switchToHttp().getResponse<Response>();
    const message =
      this.reflector.get<string>(RESPONSE_MESSAGE, context.getHandler()) ?? 'Success';

    return next.handle().pipe(
      map((payload): ApiEnvelope<unknown> => {
        const statusCode = res.statusCode;
        if (payload && typeof payload === 'object' && 'data' in payload) {
          const { data, meta } = payload as { data: unknown; meta?: unknown };
          return { statusCode, success: true, message, data, ...(meta ? { meta } : {}) };
        }
        return { statusCode, success: true, message, data: payload ?? null };
      }),
    );
  }
}
