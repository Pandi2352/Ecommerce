import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserStatus } from '@ecommerce/shared';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type UserDocument = HydratedDocument<User>;

@Schema(baseSchemaOptions(['password']))
export class User {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  /** bcrypt hash — never selected by default. */
  @Prop({ required: true, select: false })
  password!: string;

  /** Role name — references a Role document (dynamic roles + permissions). */
  @Prop({ type: String, default: 'Customer', index: true })
  role!: string;

  @Prop({ type: String, enum: Object.values(UserStatus), default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop()
  lastLogin?: Date;

  // ── Invitation tracking (set while status = INVITED) ──
  @Prop()
  invitedAt?: Date;

  /** When the current invite token stops working (invitedAt + 15 min). */
  @Prop()
  inviteExpiresAt?: Date;

  /** Id of the admin who sent the (latest) invite. */
  @Prop({ type: String })
  invitedBy?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
