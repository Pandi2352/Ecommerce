import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductStatus } from '@ecommerce/shared';
import { buildSearchFilter, parseSort, paginate } from '../../common/utils';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { Brand, BrandDocument } from '../brands/schemas/brand.schema';
import { Attribute, AttributeDocument } from '../attributes/schemas/attribute.schema';
import { OrdersService } from '../orders/orders.service';
import { CheckoutDto } from './dto/checkout.dto';

const sameVariant = (a: Record<string, string> = {}, b: Record<string, string> = {}) => {
  const ak = Object.keys(a);
  return ak.length === Object.keys(b).length && ak.every((k) => a[k] === b[k]);
};

const splitIds = (v?: string) =>
  v
    ? v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

export interface StorefrontProductQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  onSale?: boolean;
  inStock?: boolean;
  /** Dynamic attribute facets: { material: ['Linen'], gender: ['Women','Unisex'] }. */
  attrs?: Record<string, string[]>;
}

@Injectable()
export class StorefrontService {
  constructor(
    @InjectModel(Product.name) private readonly products: Model<ProductDocument>,
    @InjectModel(Brand.name) private readonly brands: Model<BrandDocument>,
    @InjectModel(Attribute.name) private readonly attributes: Model<AttributeDocument>,
    private readonly orders: OrdersService,
  ) {}

  private buildFilter(q: StorefrontProductQuery): Record<string, unknown> {
    const filter: Record<string, unknown> = {
      status: ProductStatus.ACTIVE,
      ...buildSearchFilter(['name'], q.search),
    };
    // Category: single id or a parent + its descendants (comma-separated).
    const cats = splitIds(q.category);
    if (cats.length) filter.category = cats.length > 1 ? { $in: cats } : cats[0];

    const brands = splitIds(q.brand);
    if (brands.length) filter.brandId = brands.length > 1 ? { $in: brands } : brands[0];

    if (q.minPrice != null || q.maxPrice != null) {
      const price: Record<string, number> = {};
      if (q.minPrice != null) price.$gte = q.minPrice;
      if (q.maxPrice != null) price.$lte = q.maxPrice;
      filter.price = price;
    }
    if (q.inStock) filter.stock = { $gt: 0 };
    if (q.onSale) filter.$expr = { $gt: ['$compareAtPrice', '$price'] };

    // Admin-configured attribute facets — match any of the selected values.
    for (const [key, values] of Object.entries(q.attrs ?? {})) {
      if (values.length) filter[`attributes.${key}`] = { $in: values };
    }
    return filter;
  }

  /** Public catalog — ACTIVE products only, with white-label filters. */
  listProducts(q: StorefrontProductQuery) {
    return paginate(this.products, {
      filter: this.buildFilter(q),
      sort: parseSort(q.sort),
      page: q.page ?? 1,
      pageSize: q.pageSize ?? 12,
    });
  }

  /**
   * Available filter facets for the catalog (optionally scoped to a category).
   * Fully admin-driven: price range + brands with products + every attribute the
   * admin flagged `filterable`, with the distinct values actually present.
   */
  async getFacets(category?: string) {
    const catIds = splitIds(category);
    const base: Record<string, unknown> = { status: ProductStatus.ACTIVE };
    if (catIds.length) base.category = catIds.length > 1 ? { $in: catIds } : catIds[0];

    // Price range
    const priceAgg = await this.products.aggregate<{ min: number; max: number }>([
      { $match: base },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
    ]);
    const priceRange = {
      min: Math.floor(priceAgg[0]?.min ?? 0),
      max: Math.ceil(priceAgg[0]?.max ?? 0),
    };

    // Brands that actually have products in scope (+ counts)
    const brandAgg = await this.products.aggregate<{ _id: string; count: number }>([
      { $match: { ...base, brandId: { $ne: null } } },
      { $group: { _id: '$brandId', count: { $sum: 1 } } },
    ]);
    const brandDocs = await this.brands.find({ _id: { $in: brandAgg.map((b) => b._id) } }).exec();
    const brandName = new Map(brandDocs.map((b) => [String(b._id), b.name]));
    const brands = brandAgg
      .filter((b) => brandName.has(b._id))
      .map((b) => ({ id: b._id, name: brandName.get(b._id)!, count: b.count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Attribute facets — only those the admin marked filterable (+ scope-applicable)
    const defFilter: Record<string, unknown> = { filterable: true, isActive: true };
    if (catIds.length) defFilter.$or = [{ scope: 'all' }, { categoryIds: { $in: catIds } }];
    const defs = await this.attributes.find(defFilter).sort({ sortOrder: 1 }).exec();

    const attributes = [];
    for (const d of defs) {
      const raw = await this.products.distinct(`attributes.${d.key}`, base);
      const values = raw
        .filter((v) => v !== null && v !== undefined && v !== '')
        .map((v) => String(v))
        .sort((a, b) => a.localeCompare(b));
      if (values.length) {
        attributes.push({ key: d.key, label: d.label, type: d.type, unit: d.unit, values });
      }
    }

    return { priceRange, brands, attributes };
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
