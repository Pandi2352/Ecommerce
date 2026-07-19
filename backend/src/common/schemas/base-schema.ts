import type { SchemaOptions } from '@nestjs/mongoose';

/**
 * Shared schema options: timestamps + a `toJSON` that exposes `id` (our UUID `_id`),
 * drops `__v`, and strips any sensitive fields. Pair with a UUID `_id` @Prop:
 *
 *   @Prop({ type: String, default: generateId }) _id!: string;
 */
export function baseSchemaOptions(strip: string[] = []): SchemaOptions {
  return {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        for (const key of strip) delete ret[key];
      },
    },
  };
}
