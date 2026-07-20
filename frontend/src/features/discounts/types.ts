import type { DiscountStatus, DiscountType, PaginationQuery } from '@ecommerce/shared';

export interface TierRuleItem {
  minSpend: number;
  discountValue: number;
}

export interface BuyXGetYRuleItem {
  buyQty: number;
  getQty: number;
  getDiscountPercent: number;
}

export interface CouponItem {
  _id: string;
  code: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number;
  tierRules?: TierRuleItem[];
  buyXGetYRule?: BuyXGetYRuleItem;
  isAutoApplied: boolean;
  isStackable: boolean;
  firstTimeUserOnly: boolean;
  startDate?: string;
  endDate?: string;
  usageLimitTotal?: number;
  usageLimitPerUser: number;
  usageCount: number;
  applicableCategoryIds?: string[];
  applicableBrandIds?: string[];
  status: DiscountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountStats {
  total: number;
  active: number;
  totalRedemptions: number;
  totalDiscountSaved: number;
}

export interface DiscountFilterQuery extends PaginationQuery {
  type?: DiscountType;
  status?: DiscountStatus;
}

export interface CreateCouponInput {
  code: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  tierRules?: TierRuleItem[];
  buyXGetYRule?: BuyXGetYRuleItem;
  isAutoApplied?: boolean;
  isStackable?: boolean;
  firstTimeUserOnly?: boolean;
  startDate?: string;
  endDate?: string;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  applicableCategoryIds?: string[];
  applicableBrandIds?: string[];
  status?: DiscountStatus;
}

export type UpdateCouponInput = Partial<CreateCouponInput>;

export interface BatchGenerateCodesInput {
  count: number;
  prefix?: string;
  type: DiscountType;
  value: number;
  minPurchaseAmount?: number;
  usageLimitPerUser?: number;
  startDate?: string;
  endDate?: string;
}

export interface ValidateCouponInput {
  code: string;
  cartSubtotal: number;
  cartItems?: Array<{
    productId: string;
    variantSku: string;
    quantity: number;
    price: number;
    categoryId?: string;
    brandId?: string;
  }>;
}

export interface ValidateCouponResult {
  valid: boolean;
  couponId?: string;
  code?: string;
  type?: DiscountType;
  discountAmount: number;
  isFreeShipping: boolean;
  message: string;
}
