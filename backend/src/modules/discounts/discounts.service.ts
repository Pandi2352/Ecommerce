import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiscountStatus, DiscountType } from '@ecommerce/shared';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort } from '../../common/utils';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import {
  BatchGenerateCodesDto,
  CreateCouponDto,
  ListDiscountsQueryDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/discount.dto';
import { Coupon, CouponDocument } from './schemas/coupon.schema';
import { CouponRedemption, CouponRedemptionDocument } from './schemas/coupon-redemption.schema';

export interface CouponValidationResult {
  valid: boolean;
  couponId?: string;
  code?: string;
  type?: DiscountType;
  discountAmount: number;
  isFreeShipping: boolean;
  message: string;
}

@Injectable()
export class DiscountsService extends BaseService<CouponDocument> {
  constructor(
    @InjectModel(Coupon.name) model: Model<CouponDocument>,
    @InjectModel(CouponRedemption.name) private readonly redemptionModel: Model<CouponRedemptionDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {
    super(model, 'Coupon');
  }

  async create(dto: CreateCouponDto): Promise<Coupon> {
    const code = dto.code.trim().toUpperCase();
    await this.assertCodeFree(code);

    const coupon = await this.model.create({
      ...dto,
      code,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
    return coupon;
  }

  async findById(id: string): Promise<Coupon> {
    return this.findByIdOrThrow(id);
  }

  async list(q: ListDiscountsQueryDto): Promise<{ data: Coupon[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['code'], q.search),
    };

    if (q.type) filter.type = q.type;
    if (q.status) filter.status = q.status;

    return this.paginate({
      filter,
      sort: parseSort(q.sort) || { createdAt: -1 },
      page: q.page,
      pageSize: q.pageSize,
    });
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    totalRedemptions: number;
    totalDiscountSaved: number;
  }> {
    const [total, active, redemptions] = await Promise.all([
      this.model.countDocuments(),
      this.model.countDocuments({ status: DiscountStatus.ACTIVE }),
      this.redemptionModel.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            totalAmount: { $sum: '$discountAmount' },
          },
        },
      ]),
    ]);

    const statsAgg = redemptions[0] || { count: 0, totalAmount: 0 };
    return {
      total,
      active,
      totalRedemptions: statsAgg.count,
      totalDiscountSaved: statsAgg.totalAmount,
    };
  }

  async batchGenerate(dto: BatchGenerateCodesDto): Promise<{ generatedCount: number; codes: string[] }> {
    const codes: string[] = [];
    const docs = [];

    const prefix = (dto.prefix || 'PROMO').toUpperCase();
    for (let i = 0; i < dto.count; i++) {
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      const code = `${prefix}-${randomPart}`;
      codes.push(code);

      docs.push({
        code,
        type: dto.type,
        value: dto.value,
        minPurchaseAmount: dto.minPurchaseAmount || 0,
        usageLimitPerUser: dto.usageLimitPerUser || 1,
        usageLimitTotal: 1, // Single-use by default for batch codes
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        status: DiscountStatus.ACTIVE,
      });
    }

    await this.model.insertMany(docs, { ordered: false });
    return { generatedCount: codes.length, codes };
  }

  async validateCoupon(dto: ValidateCouponDto, userId?: string): Promise<CouponValidationResult> {
    const code = dto.code.trim().toUpperCase();
    const coupon = await this.model.findOne({ code }).exec();

    if (!coupon) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Invalid promo code' };
    }

    if (coupon.status !== DiscountStatus.ACTIVE) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'This promo code is inactive or expired' };
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'This promotion has not started yet' };
    }
    if (coupon.endDate && now > coupon.endDate) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'This promo code has expired' };
    }

    if (coupon.usageLimitTotal && coupon.usageCount >= coupon.usageLimitTotal) {
      return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'Promo code global usage limit reached' };
    }

    if (userId && coupon.usageLimitPerUser) {
      const userRedemptions = await this.redemptionModel.countDocuments({ couponId: coupon._id, userId });
      if (userRedemptions >= coupon.usageLimitPerUser) {
        return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'You have reached the redemption limit for this code' };
      }
    }

    if (userId && coupon.firstTimeUserOnly) {
      const userOrdersCount = await this.orderModel.countDocuments({ customerId: userId });
      if (userOrdersCount > 0) {
        return { valid: false, discountAmount: 0, isFreeShipping: false, message: 'This code is restricted to first-time buyers only' };
      }
    }

    if (dto.cartSubtotal < coupon.minPurchaseAmount) {
      return {
        valid: false,
        discountAmount: 0,
        isFreeShipping: false,
        message: `Minimum order subtotal of $${coupon.minPurchaseAmount} required for this code`,
      };
    }

    // Compute discount value
    let discountAmount = 0;
    let isFreeShipping = false;

    switch (coupon.type) {
      case DiscountType.PERCENTAGE: {
        discountAmount = (dto.cartSubtotal * coupon.value) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
        break;
      }
      case DiscountType.FIXED_AMOUNT: {
        discountAmount = Math.min(coupon.value, dto.cartSubtotal);
        break;
      }
      case DiscountType.FREE_SHIPPING: {
        isFreeShipping = true;
        discountAmount = 0; // Handled in shipping calculation
        break;
      }
      case DiscountType.TIERED: {
        if (coupon.tierRules && coupon.tierRules.length > 0) {
          const sortedTiers = [...coupon.tierRules].sort((a, b) => b.minSpend - a.minSpend);
          const matched = sortedTiers.find((t) => dto.cartSubtotal >= t.minSpend);
          if (matched) {
            discountAmount = matched.discountValue;
          }
        }
        break;
      }
      case DiscountType.BUY_X_GET_Y: {
        if (coupon.buyXGetYRule && dto.cartItems) {
          const totalQty = dto.cartItems.reduce((acc, item) => acc + item.quantity, 0);
          const sets = Math.floor(totalQty / coupon.buyXGetYRule.buyQty);
          if (sets > 0) {
            const cheapestItem = [...dto.cartItems].sort((a, b) => a.price - b.price)[0];
            if (cheapestItem) {
              const eligibleFree = sets * coupon.buyXGetYRule.getQty;
              discountAmount = (cheapestItem.price * eligibleFree * coupon.buyXGetYRule.getDiscountPercent) / 100;
            }
          }
        }
        break;
      }
    }

    return {
      valid: true,
      couponId: coupon._id,
      code: coupon.code,
      type: coupon.type,
      discountAmount: Number(discountAmount.toFixed(2)),
      isFreeShipping,
      message: 'Coupon code applied successfully 🎉',
    };
  }

  async recordRedemption(couponId: string, userId: string, orderId: string, discountAmount: number): Promise<void> {
    const coupon = await this.findByIdOrThrow(couponId);
    await this.redemptionModel.create({
      couponId: coupon._id,
      couponCode: coupon.code,
      userId,
      orderId,
      discountAmount,
    });

    coupon.usageCount += 1;
    await coupon.save();
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const current = await this.findByIdOrThrow(id);
    const patch: Record<string, unknown> = { ...dto };

    if (dto.code) {
      const code = dto.code.trim().toUpperCase();
      await this.assertCodeFree(code, id);
      patch.code = code;
    }
    if (dto.startDate) patch.startDate = new Date(dto.startDate);
    if (dto.endDate) patch.endDate = new Date(dto.endDate);

    return (await this.model.findByIdAndUpdate(id, patch, { new: true }).exec())!;
  }

  async remove(id: string): Promise<{ id: string }> {
    const coupon = await this.findByIdOrThrow(id);
    await this.model.deleteOne({ _id: coupon._id });
    return { id };
  }

  private async assertCodeFree(code: string, excludeId?: string): Promise<void> {
    const existing = await this.model.findOne({ code });
    if (existing && existing._id !== excludeId) {
      throw new ConflictException(`Promo code "${code}" already exists`);
    }
  }
}
