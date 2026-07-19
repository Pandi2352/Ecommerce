import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { baseSchemaOptions } from '../../../common/schemas/base-schema';
import { generateId } from '../../../common/utils';

export type RoleDocument = HydratedDocument<Role>;

@Schema(baseSchemaOptions())
export class Role {
  @Prop({ type: String, default: generateId })
  _id!: string;

  @Prop({ required: true, unique: true, trim: true, index: true })
  name!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: [String], default: [] })
  permissions!: string[];

  /** System roles (e.g. Super Admin) can't be edited or deleted. */
  @Prop({ default: false })
  isSystem!: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
