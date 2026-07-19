import { z } from 'zod';

/** Validated, typed environment. Fails fast at boot if misconfigured. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_PREFIX: z.string().default('/api'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/ecommerce'),
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret-change-me'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-change-me'),
  JWT_REFRESH_TTL: z.string().default('7d'),
  // Signs password-reset + email-verification + invite tokens (must differ from access secret).
  JWT_MAIL_SECRET: z.string().default('dev-mail-secret-change-me'),

  // Seed admin (created by `npm run seed --workspace backend` when no admin exists).
  ADMIN_EMAIL: z.string().default('admin@nova.shop'),
  ADMIN_PASSWORD: z.string().default('Admin@12345'),
  ADMIN_NAME: z.string().default('Store Admin'),

  // Mail (optional — if SMTP_HOST is unset, links are logged to the console in dev).
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('NovaShop <no-reply@nova.shop>'),

  // Google OAuth (optional — the strategy only registers when both are set).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().default('http://localhost:4000/api/auth/google/callback'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}
