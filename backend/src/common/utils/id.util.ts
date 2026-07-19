import { randomUUID } from 'node:crypto';

/** Generate a UUID v4 — used as the `_id` for every document (no Mongo ObjectId). */
export const generateId = (): string => randomUUID();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value);
