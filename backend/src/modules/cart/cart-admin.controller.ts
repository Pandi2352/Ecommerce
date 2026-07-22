import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { CartService } from './cart.service';

/** Admin view of abandoned carts (permission-gated; the public cart controller is separate). */
@Controller('cart/admin')
export class CartAdminController {
  constructor(private readonly cart: CartService) {}

  @RequirePermission('orders.read')
  @Get('abandoned')
  abandoned(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('olderThanMinutes') olderThanMinutes?: string,
  ) {
    return this.cart.listAbandoned({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      olderThanMinutes: olderThanMinutes ? Number(olderThanMinutes) : undefined,
    });
  }

  @RequirePermission('orders.read')
  @Get('abandoned/stats')
  stats() {
    return this.cart.abandonedStats();
  }
}
