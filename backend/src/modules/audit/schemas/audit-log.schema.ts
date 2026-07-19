import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type AuditLogDocument = HydratedDocument<AuditLog>;

/** Append-only record of a mutating admin action. */
@Schema(baseSchemaOptions())
export class AuditLog {
  @Prop({ type: String, default: generateId })
  _id!: string;

  /** Who did it (from the access token). */
  @Prop({ type: Object })
  actor?: { id?: string; name?: string; email?: string; role?: string };

  /** Human-readable action, e.g. `DELETE /api/users/123`. */
  @Prop({ required: true, index: true })
  action!: string;

  @Prop()
  method?: string;

  @Prop({ index: true })
  path?: string;

  /** Top-level resource, e.g. `users`, `roles`, `products`. */
  @Prop({ index: true })
  resource?: string;

  @Prop({ type: String })
  resourceId?: string;

  @Prop()
  statusCode?: number;

  /** Did the action succeed (status < 400)? */
  @Prop({ default: true })
  success!: boolean;

  /** Error message when the action failed. */
  @Prop()
  errorMessage?: string;

  /** How long the request took (ms). */
  @Prop()
  durationMs?: number;

  @Prop()
  ip?: string;

  @Prop()
  userAgent?: string;

  /** Scrubbed request params/query/body (`input`) + resulting resource (`result`). */
  @Prop({ type: Object })
  meta?: Record<string, unknown>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
