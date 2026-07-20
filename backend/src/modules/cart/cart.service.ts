import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DiscountsService } from '../discounts/discounts.service';
import { InventoryRecord, InventoryRecordDocument } from '../inventory/schemas/inventory-record.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { AddToCartDto, ApplyCartCouponDto, UpdateCartItemDto, UpdateCartOptionsDto } from './dto/cart.dto';
import { Cart, CartDocument } from './schemas/cart.schema';
import { calculateCartTotals } from './utils/cart-calculator.util';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(InventoryRecord.name) private readonly inventoryModel: Model<InventoryRecordDocument>,
    private readonly discountsService: DiscountsService,
  ) {}

  async getOrCreateCart(userId?: string, guestId?: string): Promise<CartDocument> {
    if (!userId && !guestId) {
      throw new BadRequestException('Either userId or guestId must be provided');
    }

    const filter = userId ? { userId } : { guestId };
    let cart = await this.cartModel.findOne(filter).exec();

    if (!cart) {
      cart = await this.cartModel.create({
        userId,
        guestId,
        items: [],
        totals: { subtotal: 0, discount: 0, shipping: 0, tax: 0, giftWrapFee: 0, total: 0 },
        expiresAt: guestId ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      });
    }

    return cart;
  }

  async addItem(userId?: string, guestId?: string, dto?: AddToCartDto): Promise<CartDocument> {
    if (!dto) throw new BadRequestException('Missing payload');
    const cart = await this.getOrCreateCart(userId, guestId);

    const product = await this.productModel.findById(dto.productId).exec();
    if (!product) throw new NotFoundException('Product not found');

    const variant = product.variants?.find((v) => v.sku && v.sku.toUpperCase() === dto.variantSku.toUpperCase());
    const skuName = variant ? `${product.name} (${variant.sku})` : product.name;
    const itemPrice = variant?.price ?? product.price;

    // Check inventory stock
    const inv = await this.inventoryModel.findOne({ variantSku: dto.variantSku.toUpperCase() }).exec();
    const availableStock = inv ? Math.max(0, inv.onHand - inv.reserved) : product.stock;

    const existingIndex = cart.items.findIndex(
      (item) => item.variantSku.toUpperCase() === dto.variantSku.toUpperCase(),
    );

    const currentQty = existingIndex >= 0 ? cart.items[existingIndex].quantity : 0;
    const requestedQty = currentQty + dto.quantity;

    if (requestedQty > availableStock) {
      throw new BadRequestException(
        `Insufficient stock for ${skuName}. Available: ${availableStock}, Requested: ${requestedQty}`,
      );
    }

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity = requestedQty;
      cart.items[existingIndex].isSavedForLater = false;
    } else {
      cart.items.push({
        _id: String(Date.now()),
        productId: product._id,
        variantSku: dto.variantSku.toUpperCase(),
        name: skuName,
        image: product.images?.[0] || '',
        price: itemPrice,
        quantity: dto.quantity,
        isSavedForLater: false,
      } as any);
    }

    return this.refreshAndSave(cart, userId);
  }

  async updateItem(
    itemId: string,
    dto: UpdateCartItemDto,
    userId?: string,
    guestId?: string,
  ): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId, guestId);
    const item = cart.items.find((i) => i._id === itemId);
    if (!item) throw new NotFoundException('Cart item not found');

    if (dto.quantity !== undefined) {
      if (dto.quantity <= 0) {
        cart.items = cart.items.filter((i) => i._id !== itemId);
      } else {
        item.quantity = dto.quantity;
      }
    }

    if (dto.isSavedForLater !== undefined) {
      item.isSavedForLater = dto.isSavedForLater;
    }

    return this.refreshAndSave(cart, userId);
  }

  async removeItem(itemId: string, userId?: string, guestId?: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = cart.items.filter((i) => i._id !== itemId);
    return this.refreshAndSave(cart, userId);
  }

  async applyCoupon(
    dto: ApplyCartCouponDto,
    userId?: string,
    guestId?: string,
  ): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId, guestId);

    const activeItems = cart.items.filter((i) => !i.isSavedForLater);
    const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const valResult = await this.discountsService.validateCoupon(
      {
        code: dto.code,
        cartSubtotal: subtotal,
        cartItems: activeItems.map((i) => ({
          productId: i.productId,
          variantSku: i.variantSku,
          quantity: i.quantity,
          price: i.price,
        })),
      },
      userId,
    );

    if (!valResult.valid) {
      throw new BadRequestException(valResult.message);
    }

    cart.appliedCoupon = {
      code: valResult.code!,
      discountAmount: valResult.discountAmount,
      type: valResult.type!,
    };

    return this.refreshAndSave(cart, userId);
  }

  async removeCoupon(userId?: string, guestId?: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.appliedCoupon = undefined;
    return this.refreshAndSave(cart, userId);
  }

  async updateOptions(
    dto: UpdateCartOptionsDto,
    userId?: string,
    guestId?: string,
  ): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId, guestId);
    if (dto.isGiftWrap !== undefined) cart.isGiftWrap = dto.isGiftWrap;
    if (dto.deliveryNotes !== undefined) cart.deliveryNotes = dto.deliveryNotes;

    return this.refreshAndSave(cart, userId);
  }

  async mergeGuestCart(userId: string, guestId: string): Promise<CartDocument> {
    const guestCart = await this.cartModel.findOne({ guestId }).exec();
    if (!guestCart || guestCart.items.length === 0) {
      return this.getOrCreateCart(userId);
    }

    const userCart = await this.getOrCreateCart(userId);

    for (const gItem of guestCart.items) {
      const existing = userCart.items.find((i) => i.variantSku.toUpperCase() === gItem.variantSku.toUpperCase());
      if (existing) {
        existing.quantity += gItem.quantity;
      } else {
        userCart.items.push(gItem);
      }
    }

    if (guestCart.appliedCoupon && !userCart.appliedCoupon) {
      userCart.appliedCoupon = guestCart.appliedCoupon;
    }

    await this.cartModel.deleteOne({ _id: guestCart._id });
    return this.refreshAndSave(userCart, userId);
  }

  async clearCart(userId?: string, guestId?: string): Promise<CartDocument> {
    const cart = await this.getOrCreateCart(userId, guestId);
    cart.items = [];
    cart.appliedCoupon = undefined;
    cart.isGiftWrap = false;
    cart.deliveryNotes = undefined;
    return this.refreshAndSave(cart, userId);
  }

  private async refreshAndSave(cart: CartDocument, userId?: string): Promise<CartDocument> {
    // Re-validate coupon if applied
    if (cart.appliedCoupon) {
      const activeItems = cart.items.filter((i) => !i.isSavedForLater);
      const subtotal = activeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const val = await this.discountsService.validateCoupon(
        { code: cart.appliedCoupon.code, cartSubtotal: subtotal },
        userId,
      );

      if (!val.valid) {
        cart.appliedCoupon = undefined;
      } else {
        cart.appliedCoupon.discountAmount = val.discountAmount;
      }
    }

    cart.totals = calculateCartTotals(cart);
    cart.markModified('items');
    cart.markModified('totals');
    return (await cart.save())!;
  }
}
