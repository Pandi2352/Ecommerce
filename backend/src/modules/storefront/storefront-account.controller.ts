import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { CurrentUser, type AuthUser } from '../../common/decorators/current-user.decorator';
import {
  CustomerAddressDto,
  ListMyOrdersQueryDto,
  UpdateCustomerProfileDto,
} from './dto/customer.dto';

/**
 * Authenticated customer account area (profile, saved addresses, order history).
 * No @RequirePermission — any logged-in user (role Customer) may manage their own data.
 */
@Controller('storefront/account')
export class StorefrontAccountController {
  constructor(
    private readonly users: UsersService,
    private readonly orders: OrdersService,
  ) {}

  @Patch('profile')
  async updateProfile(@CurrentUser() me: AuthUser, @Body() dto: UpdateCustomerProfileDto) {
    const user = await this.users.updateProfile(me.id, dto);
    return user.toJSON();
  }

  // ── Addresses ──
  @Get('addresses')
  addresses(@CurrentUser() me: AuthUser) {
    return this.users.getAddresses(me.id);
  }

  @Post('addresses')
  addAddress(@CurrentUser() me: AuthUser, @Body() dto: CustomerAddressDto) {
    return this.users.addAddress(me.id, dto);
  }

  @Patch('addresses/:id')
  updateAddress(
    @CurrentUser() me: AuthUser,
    @Param('id') id: string,
    @Body() dto: CustomerAddressDto,
  ) {
    return this.users.updateAddress(me.id, id, dto);
  }

  @Delete('addresses/:id')
  removeAddress(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.users.removeAddress(me.id, id);
  }

  // ── Order history ──
  @Get('orders')
  myOrders(@CurrentUser() me: AuthUser, @Query() q: ListMyOrdersQueryDto) {
    return this.orders.listForCustomer(me.id, me.email, q.page, q.pageSize);
  }

  @Get('orders/:orderNumber')
  myOrder(@CurrentUser() me: AuthUser, @Param('orderNumber') orderNumber: string) {
    return this.orders.findCustomerOrder(orderNumber, me.id, me.email);
  }
}
