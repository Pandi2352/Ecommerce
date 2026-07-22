import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  CUSTOMER_ROLE,
  ORDER_STATUS_TRANSITIONS,
  OrderStatus,
  PaymentStatus,
  ProductStatus,
  SUPER_ADMIN_ROLE,
  UserStatus,
} from '@ecommerce/shared';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { RolesService } from '../modules/roles/roles.service';
import { OrdersService } from '../modules/orders/orders.service';
import { ProductsService } from '../modules/products/products.service';
import { Cart } from '../modules/cart/schemas/cart.schema';
import { Product } from '../modules/products/schemas/product.schema';
import { CollectionsService } from '../modules/collections/collections.service';
import { PagesService } from '../modules/pages/pages.service';

/** Shortest valid transition path between two order statuses (state machine). */
function statusPath(from: OrderStatus, target: OrderStatus): OrderStatus[] {
  if (from === target) return [];
  const queue: OrderStatus[][] = [[from]];
  const seen = new Set<OrderStatus>([from]);
  while (queue.length) {
    const path = queue.shift()!;
    for (const next of ORDER_STATUS_TRANSITIONS[path[path.length - 1]] ?? []) {
      if (seen.has(next)) continue;
      const np = [...path, next];
      if (next === target) return np.slice(1);
      seen.add(next);
      queue.push(np);
    }
  }
  return [];
}

/** Walk an order from `from` to `target` through valid transitions (builds a realistic timeline). */
async function walkTo(orders: OrdersService, id: string, from: OrderStatus, target: OrderStatus) {
  for (const status of statusPath(from, target)) {
    await orders.updateStatus(id, { status, note: 'Seeded' });
  }
}

const img = (seed: string) => `https://picsum.photos/seed/${seed}/700/700`;

const SIZE = { name: 'Size', values: ['S', 'M', 'L', 'XL'] };
const COLOR = (values: string[]) => ({ name: 'Color', values });

// Build a full Size×Color variant matrix with a shared base price.
const matrix = (base: number, colors: string[]) =>
  SIZE.values.flatMap((size) =>
    colors.map((color) => ({
      sku: `${size}-${color}`.toUpperCase(),
      optionValues: { Size: size, Color: color },
      price: base,
      stock: 12,
      isActive: true,
    })),
  );

const SAMPLE_PRODUCTS = [
  {
    name: 'Linen Wrap Dress',
    description: 'Breathable linen wrap dress with a flattering tie waist. A warm-weather staple.',
    price: 2499,
    compareAtPrice: 2999,
    images: [img('linen-dress'), img('linen-dress-2')],
    featured: true,
    options: [SIZE, COLOR(['Sand', 'Olive'])],
    variants: matrix(2499, ['Sand', 'Olive']),
  },
  {
    name: 'Summer Maxi Dress',
    description: 'Flowing maxi dress in a lightweight print. Effortless from day to evening.',
    price: 1999,
    images: [img('maxi-dress')],
    featured: true,
    options: [SIZE, COLOR(['Blue', 'Coral'])],
    variants: matrix(1999, ['Blue', 'Coral']),
  },
  {
    name: 'Denim Jacket',
    description: 'Classic mid-wash denim jacket with a relaxed fit. Layers over everything.',
    price: 3499,
    images: [img('denim-jacket')],
    options: [SIZE],
    variants: SIZE.values.map((s) => ({
      sku: `DENIM-${s}`,
      optionValues: { Size: s },
      price: 3499,
      stock: 8,
      isActive: true,
    })),
  },
  {
    name: 'Wool Coat',
    description: 'Tailored wool-blend coat for colder days.',
    price: 6999,
    images: [img('wool-coat')],
    stock: 15,
  },
  {
    name: 'Silk Scarf',
    description: 'Hand-finished silk scarf with a subtle sheen.',
    price: 899,
    images: [img('silk-scarf')],
    stock: 40,
  },
  {
    name: 'Cotton Tote',
    description: 'Sturdy organic-cotton tote for everyday carry.',
    price: 599,
    images: [img('cotton-tote')],
    stock: 60,
  },
  {
    name: 'Leather Belt',
    description: 'Full-grain leather belt with a brushed buckle.',
    price: 1299,
    images: [img('leather-belt')],
    stock: 25,
  },
  {
    name: 'Cashmere Sweater',
    description: 'Soft cashmere-blend crew neck. Lightweight warmth.',
    price: 4299,
    compareAtPrice: 4999,
    images: [img('cashmere-sweater')],
    featured: true,
    stock: 18,
  },
];

const SAMPLE_ORDERS = [
  {
    customer: { name: 'Aisha Khan', email: 'aisha@example.com', phone: '+91 90000 11111' },
    items: [
      { name: 'Linen Wrap Dress', price: 2499, quantity: 1, variant: { Size: 'M', Color: 'Sand' } },
    ],
    paymentMethod: 'Card',
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
  },
  {
    customer: { name: 'Ravi Menon', email: 'ravi@example.com' },
    items: [
      { name: 'Silk Scarf', price: 899, quantity: 2 },
      { name: 'Cotton Tote', price: 599, quantity: 1 },
    ],
    paymentMethod: 'UPI',
    status: OrderStatus.SHIPPED,
    paymentStatus: PaymentStatus.PAID,
    shipping: 60,
  },
  {
    customer: { name: 'Meera Nair', email: 'meera@example.com' },
    items: [{ name: 'Wool Coat', price: 6999, quantity: 1, variant: { Size: 'L' } }],
    paymentMethod: 'Card',
    status: OrderStatus.PACKED,
    paymentStatus: PaymentStatus.PAID,
  },
  {
    customer: { name: 'John Doe', email: 'john@example.com' },
    items: [{ name: 'Denim Jacket', price: 3499, quantity: 1 }],
    paymentMethod: 'COD',
    status: OrderStatus.CREATED,
    paymentStatus: PaymentStatus.PENDING,
  },
  {
    customer: { name: 'Priya Sharma', email: 'priya@example.com' },
    items: [
      {
        name: 'Summer Maxi Dress',
        price: 1999,
        quantity: 3,
        variant: { Size: 'S', Color: 'Blue' },
      },
    ],
    paymentMethod: 'UPI',
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.PAID,
    shipping: 80,
  },
  {
    customer: { name: 'Sam Lee', email: 'sam@example.com' },
    items: [{ name: 'Leather Belt', price: 1299, quantity: 1 }],
    paymentMethod: 'Card',
    status: OrderStatus.CANCELLED,
    paymentStatus: PaymentStatus.FAILED,
  },
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

  // Sample storefront customers (idempotent per email) — each with saved addresses.
  const customersPath = path.join(__dirname, '../../../seeds/customers.seed.json');
  const sampleCustomers: {
    name: string;
    email: string;
    phone?: string;
    addresses: Record<string, unknown>[];
  }[] = JSON.parse(fs.readFileSync(customersPath, 'utf-8'));
  let seededCustomers = 0;
  for (const c of sampleCustomers) {
    if (await users.findByEmailWithPassword(c.email)) continue; // already seeded
    const cust = await users.create({
      name: c.name,
      email: c.email,
      password: await bcrypt.hash('Test@123', 10),
      role: CUSTOMER_ROLE,
      status: UserStatus.ACTIVE,
    });
    await users.setEmailVerified(String(cust._id));
    if (c.phone) await users.updateProfile(String(cust._id), { phone: c.phone });
    for (const addr of c.addresses) {
      await users.addAddress(String(cust._id), addr as never);
    }
    seededCustomers++;
  }
  console.log(
    seededCustomers > 0
      ? `✓ Seeded ${seededCustomers} customers (password: Test@123) with addresses`
      : '✓ Customers already present — skipped',
  );

  // Sample catalog (only when empty) so the storefront has products to show.
  const products = app.get(ProductsService);
  if ((await products.stats()).total === 0) {
    for (const p of SAMPLE_PRODUCTS) {
      await products.create({ ...p, status: ProductStatus.ACTIVE });
    }
    console.log(`✓ Seeded ${SAMPLE_PRODUCTS.length} sample products`);
  } else {
    console.log('✓ Products already present — skipped samples');
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
      // Walk through valid transitions so the state machine is honoured + timeline is realistic.
      await walkTo(orders, String(order._id), OrderStatus.CREATED, sp.status);
    }
    console.log(`✓ Seeded ${SAMPLE_ORDERS.length} sample orders`);
  } else {
    console.log('✓ Orders already present — skipped samples');
  }

  // Sample returns/refunds (idempotent) so the Returns view has data.
  if (
    (await orders.list({ statuses: 'RETURNED,REFUNDED', page: 1, pageSize: 1 })).meta.total === 0
  ) {
    const delivered = await orders.list({ status: OrderStatus.DELIVERED, page: 1, pageSize: 3 });
    const targets = [OrderStatus.RETURNED, OrderStatus.REFUNDED];
    let n = 0;
    for (const o of delivered.data) {
      if (n >= targets.length) break;
      await walkTo(orders, String(o._id), OrderStatus.DELIVERED, targets[n]);
      n++;
    }
    console.log(
      n > 0 ? `✓ Seeded ${n} return/refund order(s)` : '✓ No delivered orders to mark returned',
    );
  } else {
    console.log('✓ Returns already present — skipped');
  }

  // Sample abandoned carts (idempotent) so the Abandoned Carts view has data.
  const cartModel = app.get(getModelToken(Cart.name)) as Model<any>;
  const productModel = app.get(getModelToken(Product.name)) as Model<any>;
  if ((await cartModel.countDocuments({ 'items.0': { $exists: true } })) === 0) {
    const pool = await productModel.find({ status: ProductStatus.ACTIVE }).limit(6).exec();
    const toItem = (p: any, qty: number) => ({
      productId: String(p._id),
      variantSku: (p.sku || p.slug || 'SKU').toUpperCase(),
      name: p.name,
      image: p.images?.[0],
      price: p.price,
      quantity: qty,
      isSavedForLater: false,
    });
    const aisha = await users.findByEmailWithPassword('aisha@example.com');
    const DAY = 86_400_000;
    const specs: { userId?: string; guestId?: string; items: any[]; ageMs: number }[] = [
      {
        guestId: 'guest-seed-anon-1',
        items: [toItem(pool[0], 1), toItem(pool[1], 2)],
        ageMs: 2 * DAY,
      },
      {
        userId: aisha ? String(aisha._id) : undefined,
        items: [toItem(pool[2], 1)],
        ageMs: 5 * 3_600_000,
      },
      {
        guestId: 'guest-seed-anon-2',
        items: [toItem(pool[3], 1), toItem(pool[4], 1), toItem(pool[5], 3)],
        ageMs: DAY,
      },
    ];
    let carts = 0;
    for (const s of specs.filter((x) => x.items.every(Boolean))) {
      const subtotal = s.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const cart = await cartModel.create({
        userId: s.userId,
        guestId: s.userId ? undefined : s.guestId,
        items: s.items,
        totals: { subtotal, discount: 0, shipping: 0, tax: 0, giftWrapFee: 0, total: subtotal },
      });
      // Backdate updatedAt via the raw driver (Mongoose would otherwise reset it to now).
      await cartModel.collection.updateOne(
        { _id: cart._id },
        { $set: { updatedAt: new Date(Date.now() - s.ageMs) } },
      );
      carts++;
    }
    console.log(`✓ Seeded ${carts} abandoned carts`);
  } else {
    console.log('✓ Carts already present — skipped');
  }

  // Sample collections (idempotent) — one manual + two automatic (rule-based).
  const collections = app.get(CollectionsService);
  if ((await collections.list({ page: 1, pageSize: 1 })).meta.total === 0) {
    const featured = await productModel.find({ status: ProductStatus.ACTIVE }).limit(4).exec();
    await collections.create({
      name: "Editor's Picks",
      description: 'A hand-picked edit of our current favourites.',
      type: 'manual',
      productIds: featured.map((p) => String(p._id)),
      isActive: true,
      isFeatured: true,
      sortOrder: 1,
    });
    await collections.create({
      name: 'On Sale',
      description: 'Everything currently discounted.',
      type: 'auto',
      match: 'all',
      conditions: [{ field: 'onSale', operator: 'is', value: 'true' }],
      isActive: true,
      isFeatured: true,
      sortOrder: 2,
    });
    await collections.create({
      name: 'Premium Edit',
      description: 'Our finest pieces over ₹3,000.',
      type: 'auto',
      match: 'all',
      conditions: [{ field: 'price', operator: 'gt', value: '3000' }],
      isActive: true,
      isFeatured: false,
      sortOrder: 3,
    });
    console.log('✓ Seeded 3 collections (1 manual, 2 automatic)');
  } else {
    console.log('✓ Collections already present — skipped');
  }

  // Sample CMS pages (idempotent) — footer policy/info pages.
  const pages = app.get(PagesService);
  if ((await pages.list({ page: 1, pageSize: 1 })).meta.total === 0) {
    const SAMPLE_PAGES = [
      {
        title: 'Shipping & Returns',
        excerpt: 'How we ship your order and how to return it.',
        sortOrder: 1,
        body: `<h2>Shipping</h2><p>We dispatch orders within <strong>1–2 business days</strong> from our regional fulfilment hubs. Standard delivery takes 3–7 business days depending on your location. Orders over ₹100 ship free.</p><h2>Returns</h2><p>Not quite right? You can return most items within <strong>30 days</strong> of delivery for a full refund, provided they are unworn and in their original packaging.</p><ul><li>Start a return from your account's Orders tab</li><li>Pack the item securely with the original invoice</li><li>Refunds are issued to your original payment method within 5–7 days</li></ul>`,
      },
      {
        title: 'Privacy Policy',
        excerpt: 'How we collect, use and protect your data.',
        sortOrder: 2,
        body: `<h2>Your privacy matters</h2><p>We collect only the information needed to process your orders and improve your shopping experience — your name, contact details, addresses and order history.</p><h3>How we use it</h3><ul><li>To fulfil and deliver your orders</li><li>To provide customer support</li><li>To send order updates you've asked for</li></ul><h3>Your rights</h3><p>You can request access to, correction of, or deletion of your personal data at any time by contacting our support team.</p>`,
      },
      {
        title: 'Terms of Service',
        excerpt: 'The terms that govern use of this store.',
        sortOrder: 3,
        body: `<h2>Using this store</h2><p>By placing an order you agree to these terms. Prices and availability are subject to change without notice. We reserve the right to refuse or cancel any order.</p><h3>Payment</h3><p>All payments are processed securely. Orders are confirmed only once payment is authorised (or, for cash on delivery, once the order is placed).</p><h3>Liability</h3><p>Our liability for any order is limited to the value of the goods purchased.</p>`,
      },
      {
        title: 'FAQ',
        excerpt: 'Answers to the questions we hear most.',
        sortOrder: 4,
        body: `<h2>Frequently asked questions</h2><h3>How do I track my order?</h3><p>Sign in and open the <strong>Orders</strong> tab in your account to see live status for every order.</p><h3>What payment methods do you accept?</h3><p>We accept major cards and cash on delivery in supported areas.</p><h3>Can I change my order after placing it?</h3><p>Contact support as soon as possible — we can usually amend orders that haven't shipped yet.</p>`,
      },
    ];
    for (const p of SAMPLE_PAGES) {
      await pages.create({ ...p, status: 'published', showInFooter: true });
    }
    console.log(`✓ Seeded ${SAMPLE_PAGES.length} CMS pages`);
  } else {
    console.log('✓ Pages already present — skipped');
  }

  await app.close();
  process.exit(0);
}

void seed();
