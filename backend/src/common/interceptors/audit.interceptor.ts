import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import type { AuthUser } from '../decorators/current-user.decorator';
import { AuditService } from '../../modules/audit/audit.service';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const SENSITIVE = ['password', 'currentPassword', 'newPassword', 'token', 'refreshToken', 's3SecretAccessKey'];

/** Best-effort real client IP: honors X-Forwarded-For, strips IPv6 mapping, tidies loopback. */
function clientIp(req: Request): string {
  const xff = req.headers['x-forwarded-for'];
  const forwarded = (Array.isArray(xff) ? xff[0] : xff)?.split(',')[0]?.trim();
  const raw = forwarded || req.ip || req.socket?.remoteAddress || '';
  return raw.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1') || 'unknown';
}

/** First path segment after the API prefix, e.g. `/api/users/123` → `users`. */
function resourceOf(path: string): string | undefined {
  return path.replace(/^\/api\//, '').split('/')[0] || undefined;
}

/**
 * Records every authenticated mutating request to the audit log — both successes
 * and failures — with actor, resource, timing, IP and scrubbed payloads.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    if (!MUTATING.has(req.method)) return next.handle();

    const startedAt = Date.now();
    const path = (req.originalUrl || req.url || '').split('?')[0];
    const base = () => {
      const user = req.user;
      if (!user?.id) return null; // only authenticated admin actions
      return {
        actor: { id: user.id, name: user.name, email: user.email, role: user.role },
        action: `${req.method} ${path}`,
        method: req.method,
        path,
        resource: resourceOf(path),
        resourceId: (req.params as Record<string, string>)?.id,
        ip: clientIp(req),
        userAgent: req.headers['user-agent'],
        durationMs: Date.now() - startedAt,
        meta: {
          input: this.scrub({ ...(req.params ?? {}), ...((req.query as object) ?? {}), ...(req.body ?? {}) }),
        } as Record<string, unknown>,
      };
    };

    return next.handle().pipe(
      tap({
        next: (result) => {
          const entry = base();
          if (!entry) return;
          const res = context.switchToHttp().getResponse<Response>();
          entry.meta.result = this.summarize(result);
          this.audit.record({ ...entry, statusCode: res.statusCode, success: res.statusCode < 400 });
        },
        error: (err: unknown) => {
          const entry = base();
          if (!entry) return;
          const statusCode = err instanceof HttpException ? err.getStatus() : 500;
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          this.audit.record({ ...entry, statusCode, success: false, errorMessage });
        },
      }),
    );
  }

  private scrub(obj: Record<string, unknown>): Record<string, unknown> {
    const copy = { ...obj };
    for (const key of SENSITIVE) if (key in copy) copy[key] = '***';
    return copy;
  }

  /** Plain, secret-free snapshot of the handler result; capped so we never store blobs. */
  private summarize(result: unknown): Record<string, unknown> | undefined {
    if (!result || typeof result !== 'object') return undefined;
    let plain: unknown;
    try {
      plain = JSON.parse(JSON.stringify(result));
    } catch {
      return undefined;
    }
    if (Array.isArray(plain)) return { count: plain.length };
    const obj = this.scrub(plain as Record<string, unknown>);
    return JSON.stringify(obj).length > 4000 ? { note: 'omitted (large)' } : obj;
  }
}
