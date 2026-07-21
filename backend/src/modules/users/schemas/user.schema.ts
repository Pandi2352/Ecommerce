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

  // ── Login security (rate-limit lockout) ──
  @Prop({ default: 0 })
  failedLoginCount!: number;

  /** While in the future, login is refused even with the right password. */
  @Prop()
  lockedUntil?: Date;

  // ── Invitation tracking (set while status = INVITED) ──
  @Prop()
  invitedAt?: Date;

  /** When the current invite token stops working (invitedAt + 15 min). */
  @Prop()
  inviteExpiresAt?: Date;

  /** Id of the admin who sent the (latest) invite. */
  @Prop({ type: String })
  invitedBy?: string;

  /** Bump to invalidate every issued access token at once (global kill-switch). */
  @Prop({ default: 0 })
  tokenVersion!: number;

  // ── Profile ──
  @Prop()
  avatarUrl?: string;

  @Prop()
  phone?: string;

  @Prop()
  jobTitle?: string;

  @Prop()
  department?: string;

  @Prop()
  bio?: string;

  @Prop()
  location?: string;

  @Prop()
  timezone?: string;

  @Prop({ type: Object })
  links?: { website?: string; twitter?: string; linkedin?: string; github?: string };

  /** Saved shipping addresses (storefront customers). */
  @Prop({ type: [Object], default: [] })
  addresses!: CustomerAddress[];
}

export interface CustomerAddress {
  id: string;
  label?: string;
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
