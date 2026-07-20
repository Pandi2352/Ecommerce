import { z } from 'zod';

/**
 * Shared Zod schemas. Both the NestJS DTOs (ZodValidationPipe) and the React forms
 * (React Hook Form) consume these, so client and server validate identically.
 */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  search: z.string().optional(),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = loginSchema.extend({
  name: z.string().min(2),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  slug: z.string().optional(),
  logo: z.string().optional().or(z.literal('')),
  banner: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
});
export type BrandInput = z.infer<typeof brandSchema>;

export const vendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').max(100),
  code: z.string().min(1, 'Vendor code is required').max(50),
  contactName: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  website: z.string().optional().or(z.literal('')),
  commissionRate: z.number().min(0).max(100).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_APPROVAL']).default('ACTIVE'),
  notes: z.string().optional().or(z.literal('')),
});
export type VendorInput = z.infer<typeof vendorSchema>;

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(100),
  code: z.string().min(1, 'Warehouse code is required').max(50),
  contactName: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
export type WarehouseInput = z.infer<typeof warehouseSchema>;

export const stockAdjustmentSchema = z.object({
  type: z.enum(['PURCHASE', 'TRANSFER', 'DAMAGE', 'SALE', 'ADJUSTMENT', 'RETURN']),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  productId: z.string().min(1, 'Product is required'),
  variantSku: z.string().min(1, 'SKU is required'),
  quantityDelta: z.number().int('Quantity delta must be an integer'),
  reason: z.string().optional().or(z.literal('')),
});
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const stockTransferSchema = z.object({
  sourceWarehouseId: z.string().min(1, 'Source warehouse is required'),
  targetWarehouseId: z.string().min(1, 'Target warehouse is required'),
  productId: z.string().min(1, 'Product is required'),
  variantSku: z.string().min(1, 'SKU is required'),
  quantity: z.number().int().min(1, 'Transfer quantity must be at least 1'),
  reason: z.string().optional().or(z.literal('')),
});
export type StockTransferInput = z.infer<typeof stockTransferSchema>;

export const couponSchema = z.object({
  code: z.string().min(1, 'Promo code is required').max(50),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING', 'BUY_X_GET_Y', 'TIERED']).default('PERCENTAGE'),
  value: z.number().min(0, 'Discount value must be at least 0').default(0),
  minPurchaseAmount: z.number().min(0).default(0),
  maxDiscountAmount: z.number().min(0).optional(),
  tierRules: z
    .array(
      z.object({
        minSpend: z.number().min(0),
        discountValue: z.number().min(0),
      }),
    )
    .optional(),
  buyXGetYRule: z
    .object({
      buyQty: z.number().min(1),
      getQty: z.number().min(1),
      getDiscountPercent: z.number().min(0).max(100).default(100),
    })
    .optional(),
  isAutoApplied: z.boolean().default(false),
  isStackable: z.boolean().default(false),
  firstTimeUserOnly: z.boolean().default(false),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimitTotal: z.number().min(1).optional(),
  usageLimitPerUser: z.number().min(1).default(1),
  applicableCategoryIds: z.array(z.string()).optional(),
  applicableBrandIds: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'DISABLED']).default('ACTIVE'),
});
export type CouponInput = z.infer<typeof couponSchema>;

export const batchGenerateCodesSchema = z.object({
  count: z.number().int().min(1).max(500).default(10),
  prefix: z.string().max(20).default('PROMO'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING']).default('PERCENTAGE'),
  value: z.number().min(0).default(10),
  minPurchaseAmount: z.number().min(0).default(0),
  usageLimitPerUser: z.number().min(1).default(1),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
export type BatchGenerateCodesInput = z.infer<typeof batchGenerateCodesSchema>;

export const validateCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  cartSubtotal: z.number().min(0),
  cartItems: z
    .array(
      z.object({
        productId: z.string(),
        variantSku: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0),
        categoryId: z.string().optional(),
        brandId: z.string().optional(),
      }),
    )
    .optional(),
});
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;

export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantSku: z.string().min(1, 'Variant SKU is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
});
export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  isSavedForLater: z.boolean().optional(),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const applyCartCouponSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
});
export type ApplyCartCouponInput = z.infer<typeof applyCartCouponSchema>;

export const cartOptionsSchema = z.object({
  isGiftWrap: z.boolean().optional(),
  deliveryNotes: z.string().optional(),
});
export type CartOptionsInput = z.infer<typeof cartOptionsSchema>;




