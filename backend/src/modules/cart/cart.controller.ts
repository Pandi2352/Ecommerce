import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CartService } from './cart.service';
import {
  AddToCartDto,
  ApplyCartCouponDto,
  MergeCartDto,
  UpdateCartItemDto,
  UpdateCartOptionsDto,
} from './dto/cart.dto';

@Public()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req: any, @Headers('x-guest-id') guestId?: string) {
    return this.cartService.getOrCreateCart(req.user?.id, guestId);
  }

  @Post('items')
  addItem(
    @Body() dto: AddToCartDto,
    @Request() req: any,
    @Headers('x-guest-id') guestId?: string,
  ) {
    return this.cartService.addItem(req.user?.id, guestId, dto);
  }

  @Patch('items/:itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Request() req: any,
    @Headers('x-guest-id') guestId?: string,
  ) {
    return this.cartService.updateItem(itemId, dto, req.user?.id, guestId);
  }

  @Delete('items/:itemId')
  removeItem(
    @Param('itemId') itemId: string,
    @Request() req: any,
    @Headers('x-guest-id') guestId?: string,
  ) {
    return this.cartService.removeItem(itemId, req.user?.id, guestId);
  }

  @Post('coupon')
  applyCoupon(
    @Body() dto: ApplyCartCouponDto,
    @Request() req: any,
    @Headers('x-guest-id') guestId?: string,
  ) {
    return this.cartService.applyCoupon(dto, req.user?.id, guestId);
  }

  @Delete('coupon')
  removeCoupon(@Request() req: any, @Headers('x-guest-id') guestId?: string) {
    return this.cartService.removeCoupon(req.user?.id, guestId);
  }

  @Post('options')
  updateOptions(
    @Body() dto: UpdateCartOptionsDto,
    @Request() req: any,
    @Headers('x-guest-id') guestId?: string,
  ) {
    return this.cartService.updateOptions(dto, req.user?.id, guestId);
  }

  @Post('merge')
  mergeCart(@Body() dto: MergeCartDto, @Request() req: any) {
    return this.cartService.mergeGuestCart(req.user?.id || req.user?._id, dto.guestId);
  }

  @Delete()
  clearCart(@Request() req: any, @Headers('x-guest-id') guestId?: string) {
    return this.cartService.clearCart(req.user?.id, guestId);
  }
}
