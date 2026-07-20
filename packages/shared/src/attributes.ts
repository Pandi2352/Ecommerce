/** Product attribute field types (see docs/18-product-attributes.md). */
export const ATTRIBUTE_TYPES = [
  'text',
  'textarea',
  'number',
  'boolean',
  'select',
  'multiselect',
  'date',
  'url',
] as const;

export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

/** Types whose values must come from a fixed `options` list. */
export const OPTION_ATTRIBUTE_TYPES: AttributeType[] = ['select', 'multiselect'];

/** Attribute `key` format — lowercase, starts with a letter, then letters/digits/underscore. */
export const ATTRIBUTE_KEY_REGEX = /^[a-z][a-z0-9_]*$/;
