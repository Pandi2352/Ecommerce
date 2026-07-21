import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { StorefrontService } from './storefront.service';
import { StorefrontController } from './storefront.controller';
import { StorefrontAuthController } from './storefront-auth.controller';
import { StorefrontAccountController } from './storefront-account.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    OrdersModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [StorefrontController, StorefrontAuthController, StorefrontAccountController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
