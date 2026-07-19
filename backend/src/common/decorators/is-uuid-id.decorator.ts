import { registerDecorator, type ValidationOptions } from 'class-validator';
import { isUuid } from '../utils';

/**
 * Validates that a property is a UUID string — the id format used for every
 * document `_id` and reference in this app (we don't use Mongo ObjectIds).
 * Use on id params/body fields instead of class-validator's `@IsMongoId()`.
 */
export function IsUuidId(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUuidId',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate: (value: unknown) => isUuid(value),
        defaultMessage: () => `${propertyName} must be a valid UUID`,
      },
    });
  };
}
