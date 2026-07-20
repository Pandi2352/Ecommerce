import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DiscountsModule } from '../discounts/discounts.module';
import { InventoryRecord, InventoryRecordSchema } from '../inventory/schemas/inventory-record.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart, CartSchema } from './schemas/cart.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: InventoryRecord.name, schema: InventoryRecordSchema },
    ]),
    DiscountsModule,
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
