import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { Coupon, CouponSchema } from './schemas/coupon.schema';
import { CouponRedemption, CouponRedemptionSchema } from './schemas/coupon-redemption.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Coupon.name, schema: CouponSchema },
      { name: CouponRedemption.name, schema: CouponRedemptionSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [DiscountsController],
  providers: [DiscountsService],
  exports: [DiscountsService],
})
export class DiscountsModule {}
