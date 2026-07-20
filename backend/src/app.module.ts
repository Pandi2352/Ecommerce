import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './modules/health/health.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { ProductsModule } from './modules/products/products.module';
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AttributesModule } from './modules/attributes/attributes.module';
import { OrdersModule } from './modules/orders/orders.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { CartModule } from './modules/cart/cart.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditModule } from './modules/audit/audit.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    // Global rate limit: 120 requests / minute / IP (login is tightened separately).
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    MailModule,
    HealthModule,
    UsersModule,
    RolesModule,
    AuthModule,
    CategoriesModule,
    BrandsModule,
    VendorsModule,
    ProductsModule,
    WarehousesModule,
    InventoryModule,
    AttributesModule,
    OrdersModule,
    DiscountsModule,
    CartModule,
    AuditModule,
    SettingsModule,
    UploadsModule,
  ],
  providers: [
    // Rate limit first, before auth.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Order: authenticate → coarse role check → fine permission check.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // Standard success envelope on every response.
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    // Record authenticated mutating actions to the audit log.
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}
