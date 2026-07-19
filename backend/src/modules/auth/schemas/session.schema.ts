import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type SessionDocument = HydratedDocument<Session>;

/** A refresh-token session — the token is stored hashed so it can be revoked. */
@Schema(baseSchemaOptions())
export class Session {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ type: String, ref: 'User', required: true, index: true })
  user!: string;

  @Prop({ required: true })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  userAgent?: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
