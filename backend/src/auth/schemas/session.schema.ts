import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

/** A refresh-token session — the token is stored hashed so it can be revoked. */
@Schema({ timestamps: true })
export class Session {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  user!: Types.ObjectId;

  @Prop({ required: true })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  userAgent?: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
