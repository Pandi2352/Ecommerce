import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OrderStatus, PaymentStatus, SUPER_ADMIN_ROLE, UserStatus } from '@ecommerce/shared';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { RolesService } from '../modules/roles/roles.service';
import { OrdersService } from '../modules/orders/orders.service';

const SAMPLE_ORDERS = [
  { customer: { name: 'Aisha Khan', email: 'aisha@example.com', phone: '+91 90000 11111' }, items: [{ name: 'Linen Wrap Dress', price: 2499, quantity: 1, variant: { Size: 'M', Color: 'Sand' } }], paymentMethod: 'Card', status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID },
  { customer: { name: 'Ravi Menon', email: 'ravi@example.com' }, items: [{ name: 'Silk Scarf', price: 899, quantity: 2 }, { name: 'Cotton Tote', price: 599, quantity: 1 }], paymentMethod: 'UPI', status: OrderStatus.SHIPPED, paymentStatus: PaymentStatus.PAID, shipping: 60 },
  { customer: { name: 'Meera Nair', email: 'meera@example.com' }, items: [{ name: 'Wool Coat', price: 6999, quantity: 1, variant: { Size: 'L' } }], paymentMethod: 'Card', status: OrderStatus.PACKED, paymentStatus: PaymentStatus.PAID },
  { customer: { name: 'John Doe', email: 'john@example.com' }, items: [{ name: 'Denim Jacket', price: 3499, quantity: 1 }], paymentMethod: 'COD', status: OrderStatus.CREATED, paymentStatus: PaymentStatus.PENDING },
  { customer: { name: 'Priya Sharma', email: 'priya@example.com' }, items: [{ name: 'Summer Maxi Dress', price: 1999, quantity: 3, variant: { Size: 'S', Color: 'Blue' } }], paymentMethod: 'UPI', status: OrderStatus.DELIVERED, paymentStatus: PaymentStatus.PAID, shipping: 80 },
  { customer: { name: 'Sam Lee', email: 'sam@example.com' }, items: [{ name: 'Leather Belt', price: 1299, quantity: 1 }], paymentMethod: 'Card', status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.FAILED },
];

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

  // Sample orders (only when there are none) so the dashboard shows real data.
  const orders = app.get(OrdersService);
  if ((await orders.stats()).total === 0) {
    for (const sp of SAMPLE_ORDERS) {
      const order = await orders.create({
        customer: sp.customer,
        items: sp.items,
        paymentMethod: sp.paymentMethod,
        paymentStatus: sp.paymentStatus,
        shipping: sp.shipping ?? 0,
      });
      if (sp.status !== OrderStatus.CREATED) {
        await orders.updateStatus(order._id, { status: sp.status, note: 'Seeded' });
      }
    }
    console.log(`✓ Seeded ${SAMPLE_ORDERS.length} sample orders`);
  } else {
    console.log('✓ Orders already present — skipped samples');
  }

  await app.close();
  process.exit(0);
}

void seed();
