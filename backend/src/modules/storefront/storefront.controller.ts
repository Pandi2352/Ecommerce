import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { CheckoutDto } from './dto/checkout.dto';
import { Public } from '../../common/decorators/public.decorator';

/** Public, unauthenticated storefront API (consumed by the customer site). */
@Public()
@Controller('storefront')
export class StorefrontController {
  constructor(private readonly storefront: StorefrontService) {}

  @Get('products')
  listProducts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
  ) {
    return this.storefront.listProducts({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search,
      category,
      sort,
    });
  }

  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.storefront.getProductBySlug(slug);
  }

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto) {
    return this.storefront.checkout(dto);
  }
}
