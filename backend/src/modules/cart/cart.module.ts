import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscountsModule } from '../discounts/discounts.module';
import {
  InventoryRecord,
  InventoryRecordSchema,
} from '../inventory/schemas/inventory-record.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CartController } from './cart.controller';
import { CartAdminController } from './cart-admin.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: InventoryRecord.name, schema: InventoryRecordSchema },
      { name: User.name, schema: UserSchema },
    ]),
    DiscountsModule,
  ],
  controllers: [CartController, CartAdminController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
