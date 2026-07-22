import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Brand, BrandSchema } from '../brands/schemas/brand.schema';
import { Attribute, AttributeSchema } from '../attributes/schemas/attribute.schema';
import { OrdersModule } from '../orders/orders.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { CollectionsModule } from '../collections/collections.module';
import { PagesModule } from '../pages/pages.module';
import { StorefrontService } from './storefront.service';
import { StorefrontController } from './storefront.controller';
import { StorefrontAuthController } from './storefront-auth.controller';
import { StorefrontAccountController } from './storefront-account.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Attribute.name, schema: AttributeSchema },
    ]),
    OrdersModule,
    AuthModule,
    UsersModule,
    CollectionsModule,
    PagesModule,
  ],
  controllers: [StorefrontController, StorefrontAuthController, StorefrontAccountController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
