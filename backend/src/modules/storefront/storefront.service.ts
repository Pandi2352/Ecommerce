import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductStatus } from '@ecommerce/shared';
import { buildSearchFilter, parseSort, paginate } from '../../common/utils';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { OrdersService } from '../orders/orders.service';
import { CheckoutDto } from './dto/checkout.dto';

const sameVariant = (a: Record<string, string> = {}, b: Record<string, string> = {}) => {
  const ak = Object.keys(a);
  return ak.length === Object.keys(b).length && ak.every((k) => a[k] === b[k]);
};

@Injectable()
export class StorefrontService {
  constructor(
    @InjectModel(Product.name) private readonly products: Model<ProductDocument>,
    private readonly orders: OrdersService,
  ) {}

  /** Public catalog — ACTIVE products only. */
  listProducts(q: {
    page?: number;
    pageSize?: number;
    search?: string;
    category?: string;
    sort?: string;
  }) {
    const filter: Record<string, unknown> = {
      status: ProductStatus.ACTIVE,
      ...buildSearchFilter(['name'], q.search),
    };
    if (q.category) filter.category = q.category;
    return paginate(this.products, {
      filter,
      sort: parseSort(q.sort),
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 12,
    });
  }

  async getProductBySlug(slug: string): Promise<ProductDocument> {
    const product = await this.products.findOne({ slug, status: ProductStatus.ACTIVE }).exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  /** Public checkout — prices are resolved server-side from real products (never trust the client). */
  async checkout(dto: CheckoutDto) {
    const items: Array<{
      productId: string;
      name: string;
      sku?: string;
      image?: string;
      variant?: Record<string, string>;
      price: number;
      quantity: number;
    }> = [];
    for (const ci of dto.items) {
      const p = await this.products.findById(ci.productId).exec();
      if (!p || p.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException('One or more products are no longer available');
      }
      let price = p.price;
      let sku = p.sku;
      let image = p.images?.[0];
      if (ci.variant && p.variants?.length) {
        const match = p.variants.find((v) => sameVariant(v.optionValues, ci.variant));
        if (!match)
          throw new BadRequestException(`Selected variant for "${p.name}" is unavailable`);
        price = match.price;
        sku = match.sku ?? sku;
        image = match.image ?? image;
      }
      items.push({
        productId: String(p._id),
        name: p.name,
        sku,
        image,
        variant: ci.variant,
        price,
        quantity: ci.quantity,
      });
    }
    return this.orders.create({
      customer: dto.customer,
      items,
      shippingAddress: dto.shippingAddress,
      paymentMethod: dto.paymentMethod ?? 'COD',
    });
  }
}
