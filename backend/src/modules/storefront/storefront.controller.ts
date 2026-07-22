import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { CollectionsService } from '../collections/collections.service';
import { CheckoutDto } from './dto/checkout.dto';
import { Public } from '../../common/decorators/public.decorator';

/** Public, unauthenticated storefront API (consumed by the customer site). */
@Public()
@Controller('storefront')
export class StorefrontController {
  constructor(
    private readonly storefront: StorefrontService,
    private readonly collections: CollectionsService,
  ) {}

  @Get('collections')
  listCollections() {
    return this.collections.listPublic();
  }

  @Get('collections/featured')
  featuredCollections() {
    return this.collections.listFeatured();
  }

  @Get('collections/:slug')
  collectionBySlug(@Param('slug') slug: string) {
    return this.collections.getPublicBySlug(slug);
  }

  @Get('products')
  listProducts(@Query() q: Record<string, string>) {
    // Dynamic attribute facets arrive as `attr_<key>=v1,v2`.
    const attrs: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(q)) {
      if (k.startsWith('attr_') && v) attrs[k.slice(5)] = v.split(',').filter(Boolean);
    }
    return this.storefront.listProducts({
      page: q.page ? Number(q.page) : undefined,
      pageSize: q.pageSize ? Number(q.pageSize) : undefined,
      search: q.search,
      category: q.category,
      sort: q.sort,
      minPrice: q.minPrice ? Number(q.minPrice) : undefined,
      maxPrice: q.maxPrice ? Number(q.maxPrice) : undefined,
      brand: q.brand,
      onSale: q.onSale === 'true',
      inStock: q.inStock === 'true',
      attrs,
    });
  }

  @Get('facets')
  facets(@Query('category') category?: string) {
    return this.storefront.getFacets(category);
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
