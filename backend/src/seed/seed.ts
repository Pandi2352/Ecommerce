import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { SUPER_ADMIN_ROLE, UserStatus } from '@ecommerce/shared';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { RolesService } from '../modules/roles/roles.service';

/**
 * Seeds the single store ADMIN from env (ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME).
 * Idempotent — does nothing if that account already exists.
 * Run: `npm run seed --workspace backend`
 */
async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const users = app.get(UsersService);
  const roles = app.get(RolesService);
  const config = app.get(ConfigService);

  await roles.seedDefaults();
  console.log('✓ Default roles ensured (Super Admin, Admin, Customer)');

  const email = config.getOrThrow<string>('ADMIN_EMAIL');
  const password = config.getOrThrow<string>('ADMIN_PASSWORD');
  const name = config.getOrThrow<string>('ADMIN_NAME');

  const existing = await users.findByEmailWithPassword(email);
  if (existing) {
    console.log(`✓ Super admin already exists: ${email}`);
  } else {
    const admin = await users.create({
      email,
      name,
      password: await bcrypt.hash(password, 10),
      role: SUPER_ADMIN_ROLE,
      status: UserStatus.ACTIVE,
    });
    await users.setEmailVerified(String(admin._id));
    console.log(`✓ Seeded SUPER ADMIN\n  email:    ${email}\n  password: ${password}`);
  }

  await app.close();
  process.exit(0);
}

void seed();
