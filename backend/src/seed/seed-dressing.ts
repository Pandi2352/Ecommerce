import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from '../app.module';
import { CategoriesService } from '../modules/categories/categories.service';
import { ProductsService } from '../modules/products/products.service';
import { BrandsService } from '../modules/brands/brands.service';
import { VendorsService } from '../modules/vendors/vendors.service';
import { AttributesService } from '../modules/attributes/attributes.service';
import { WarehousesService } from '../modules/warehouses/warehouses.service';
import { SettingsService } from '../modules/settings/settings.service';
import { ProductStatus, StockAdjustmentType } from '@ecommerce/shared';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../modules/products/schemas/product.schema';
import { Category } from '../modules/categories/schemas/category.schema';
import { Brand } from '../modules/brands/schemas/brand.schema';
import { Vendor } from '../modules/vendors/schemas/vendor.schema';
import { Attribute } from '../modules/attributes/schemas/attribute.schema';
import { Warehouse } from '../modules/warehouses/schemas/warehouse.schema';
import { InventoryRecord } from '../modules/inventory/schemas/inventory-record.schema';
import { StockAdjustment } from '../modules/inventory/schemas/stock-adjustment.schema';

/** Size & Color Variant Matrix Generator for Clothing Items */
const SIZE_OPTION = { name: 'Size', values: ['S', 'M', 'L', 'XL'] };
const COLOR_OPTION = (colors: string[]) => ({ name: 'Color', values: colors });

// SKUs must be globally unique (inventory is keyed on variantSku+warehouseId),
// so every product gets its own SKU prefix (e.g. NOVA-01-S-BLACK).
const buildVariants = (skuPrefix: string, basePrice: number, colors: string[]) =>
  SIZE_OPTION.values.flatMap((size) =>
    colors.map((color) => ({
      sku: `${skuPrefix}-${size}-${color}`.toUpperCase(),
      optionValues: { Size: size, Color: color },
      price: basePrice,
      stock: 15,
      isActive: true,
    })),
  );

/** Clear all previous database entries for a clean fresh seed */
export async function clearAllData(appContext: any) {
  console.log('\n🧹 Clearing old catalog, inventory, warehouses, and attributes...');
  const productModel = appContext.get(getModelToken(Product.name)) as Model<any>;
  const categoryModel = appContext.get(getModelToken(Category.name)) as Model<any>;
  const brandModel = appContext.get(getModelToken(Brand.name)) as Model<any>;
  const vendorModel = appContext.get(getModelToken(Vendor.name)) as Model<any>;
  const attributeModel = appContext.get(getModelToken(Attribute.name)) as Model<any>;
  const warehouseModel = appContext.get(getModelToken(Warehouse.name)) as Model<any>;
  const inventoryModel = appContext.get(getModelToken(InventoryRecord.name)) as Model<any>;
  const ledgerModel = appContext.get(getModelToken(StockAdjustment.name)) as Model<any>;

  await Promise.all([
    productModel.deleteMany({}),
    categoryModel.deleteMany({}),
    brandModel.deleteMany({}),
    vendorModel.deleteMany({}),
    attributeModel.deleteMany({}),
    warehouseModel.deleteMany({}),
    inventoryModel.deleteMany({}),
    ledgerModel.deleteMany({}),
  ]);
  console.log('  ✓ Database cleared successfully!');
}

/** Seed Fashion Product Fields (Custom Attributes Preset) */
export async function seedAttributes(appContext: any) {
  const attributesService = appContext.get(AttributesService);
  console.log('\n⚙️ [Seed Call 1/7] Applying Fashion Product Fields Preset...');
  const res = await attributesService.applyPreset('fashion');
  console.log(`  ✓ Registered fashion custom product attributes (added: ${res.added})`);
}

/** Seed 8 Fashion Brands */
export async function seedBrands(appContext: any) {
  const brandsService = appContext.get(BrandsService);
  const jsonPath = path.join(__dirname, '../../../seeds/brands.seed.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const brandsList = JSON.parse(rawData);

  console.log('\n🏷️ [Seed Call 2/7] Seeding 8 Fashion Brands...');
  const brandMap = new Map<string, string>();

  for (const bDto of brandsList) {
    const created = await brandsService.create(bDto);
    brandMap.set(bDto.slug, String((created as any)._id));
    console.log(`  ✓ Brand created: ${bDto.name} (${bDto.slug})`);
  }

  return brandMap;
}

/** Seed 4 Fashion Vendors */
export async function seedVendors(appContext: any) {
  const vendorsService = appContext.get(VendorsService);
  const jsonPath = path.join(__dirname, '../../../seeds/vendors.seed.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const vendorsList = JSON.parse(rawData);

  console.log('\n🏭 [Seed Call 3/7] Seeding 4 Fashion Vendors...');
  const vendorMap = new Map<string, string>();

  for (const vDto of vendorsList) {
    const created = await vendorsService.create(vDto);
    vendorMap.set(vDto.code, String((created as any)._id));
    console.log(`  ✓ Vendor created: ${vDto.name} (${vDto.code})`);
  }

  return vendorMap;
}

/** Seed the nested Dressing category tree (parents must precede children in the JSON). */
export async function seedCategories(appContext: any) {
  const categoriesService = appContext.get(CategoriesService);
  const jsonPath = path.join(__dirname, '../../../seeds/categories.seed.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const categoriesList = JSON.parse(rawData);

  console.log(
    `\n📦 [Seed Call 4/7] Seeding ${categoriesList.length} Dressing Shop Categories (tree)...`,
  );
  const categoryMap = new Map<string, string>();

  for (const { parentSlug, ...catDto } of categoriesList) {
    // Resolve the parent slug to its created _id (parents are seeded first).
    const parent = parentSlug ? (categoryMap.get(parentSlug) ?? null) : null;
    if (parentSlug && !parent) {
      console.warn(
        `  ⚠ Parent "${parentSlug}" not found for "${catDto.slug}" — seeding as top-level`,
      );
    }
    const created = await categoriesService.create({ ...catDto, parent });
    categoryMap.set(catDto.slug, String((created as any)._id));
    const indent = parent ? '    ↳ ' : '  ✓ ';
    console.log(`${indent}Category created: ${catDto.name} (${catDto.slug})`);
  }

  return categoryMap;
}

/** Seed 20 Dressing Products with Brands, Vendors, and Custom Product Fields */
export async function seedProducts(
  appContext: any,
  categoryMap: Map<string, string>,
  brandMap: Map<string, string>,
  vendorMap: Map<string, string>,
) {
  const productsService = appContext.get(ProductsService);
  const jsonPath = path.join(__dirname, '../../../seeds/products.seed.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const productsList = JSON.parse(rawData);

  console.log('\n👗 [Seed Call 6/7] Seeding 20 Dressing Shop Products with Custom Attributes...');
  const created: SeededProduct[] = [];
  let count = 0;

  for (const item of productsList) {
    const { categorySlug, brandSlug, vendorCode, ...productData } = item;
    const categoryId = categoryMap.get(categorySlug);
    const brandId = brandMap.get(brandSlug);
    const vendorId = vendorMap.get(vendorCode);

    // Each product gets a unique SKU prefix so its variant SKUs are globally unique.
    const skuPrefix = `NOVA-${String(count + 1).padStart(2, '0')}`;

    // Build clothing options & variant matrix
    const colors = ['Black', 'Navy', 'Maroon', 'Beige'];
    const options = [SIZE_OPTION, COLOR_OPTION(colors)];
    const variants = buildVariants(skuPrefix, productData.price, colors);

    const doc = await productsService.create({
      ...productData,
      sku: skuPrefix,
      category: categoryId || undefined,
      brandId: brandId || undefined,
      vendorId: vendorId || undefined,
      options,
      variants,
      status: ProductStatus.ACTIVE,
    });
    created.push({
      _id: String((doc as any)._id),
      name: productData.name,
      variantSkus: variants.map((v) => v.sku),
    });
    count++;
    console.log(
      `  ✓ Product seeded (${count}/20): ${productData.name} (Brand: ${brandSlug}, Vendor: ${vendorCode})`,
    );
  }

  console.log(`\n🎉 Successfully seeded ${count} Dressing Shop products into DB!\n`);
  return created;
}

interface SeededProduct {
  _id: string;
  name: string;
  variantSkus: string[];
}

/** Seed warehouses from JSON (one primary). Returns code->id map + the primary id. */
export async function seedWarehouses(appContext: any) {
  const warehousesService = appContext.get(WarehousesService);
  const jsonPath = path.join(__dirname, '../../../seeds/warehouses.seed.json');
  const list = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  console.log(`\n🏬 [Seed Call 5/7] Seeding ${list.length} Warehouses...`);
  const map = new Map<string, string>();
  let primaryId = '';
  for (const dto of list) {
    const created = await warehousesService.create(dto);
    const id = String((created as any)._id);
    map.set(dto.code, id);
    if ((created as any).isPrimary) primaryId = id;
    console.log(
      `  ✓ Warehouse: ${dto.name} (${dto.code})${(created as any).isPrimary ? ' [PRIMARY]' : ''}`,
    );
  }
  if (!primaryId) primaryId = [...map.values()][0];
  return { map, primaryId };
}

/**
 * Seed per-(variant, warehouse) inventory records + a small movement ledger.
 * on-hand is varied deterministically so the Stock / Low Stock pages show a mix
 * of healthy, low, and out-of-stock rows.
 */
export async function seedInventory(
  appContext: any,
  products: SeededProduct[],
  warehouses: { map: Map<string, string>; primaryId: string },
) {
  const inventoryModel = appContext.get(getModelToken(InventoryRecord.name)) as Model<any>;
  const ledgerModel = appContext.get(getModelToken(StockAdjustment.name)) as Model<any>;
  const { map, primaryId } = warehouses;
  const secondaryId = map.get('WH-NORTH');

  console.log('\n📊 [Seed Call 7/7] Seeding per-warehouse inventory records + ledger...');

  const records: any[] = [];
  let pIdx = 0;
  for (const p of products) {
    p.variantSkus.forEach((sku, vIdx) => {
      const seq = pIdx * 16 + vIdx;
      let onHand: number;
      if (seq % 17 === 0)
        onHand = 0; // out of stock
      else if (seq % 6 === 0)
        onHand = 1 + (seq % 4); // 1-4 => low (threshold 5)
      else onHand = 12 + (seq % 45); // healthy
      const reserved = onHand > 6 ? seq % 4 : 0;
      records.push({
        productId: p._id,
        variantSku: sku,
        warehouseId: primaryId,
        onHand,
        reserved,
        lowStockThreshold: 5,
      });
      // Distribute a slice (first color's 4 sizes) of every 2nd product to the secondary hub.
      if (secondaryId && pIdx % 2 === 0 && vIdx < 4) {
        records.push({
          productId: p._id,
          variantSku: sku,
          warehouseId: secondaryId,
          onHand: 5 + ((seq * 3) % 30),
          reserved: 0,
          lowStockThreshold: 5,
        });
      }
    });
    pIdx++;
  }
  await inventoryModel.insertMany(records);

  // A small, realistic movement ledger for the Stock Ledger drawer.
  const types = [
    StockAdjustmentType.PURCHASE,
    StockAdjustmentType.PURCHASE,
    StockAdjustmentType.SALE,
    StockAdjustmentType.ADJUSTMENT,
    StockAdjustmentType.RETURN,
    StockAdjustmentType.DAMAGE,
  ];
  const ledger = records.slice(0, 14).map((r, k) => {
    const type = types[k % types.length];
    const outbound = type === StockAdjustmentType.SALE || type === StockAdjustmentType.DAMAGE;
    return {
      type,
      warehouseId: r.warehouseId,
      productId: r.productId,
      variantSku: r.variantSku,
      quantityDelta: outbound ? -(1 + (k % 3)) : 5 + (k % 10),
      reason: 'Initial seed movement',
      adjustedBy: 'Seed',
    };
  });
  await ledgerModel.insertMany(ledger);

  console.log(
    `  ✓ ${records.length} inventory records across ${map.size} warehouses + ${ledger.length} ledger entries`,
  );
}

export async function seedStorefrontSettings(appContext: any) {
  const settingsService = appContext.get(SettingsService);
  const jsonPath = path.join(__dirname, '../../../seeds/storefront.seed.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const settingsData = JSON.parse(rawData);

  console.log('\n⚙️ [Seed Call 7/7] Seeding Storefront Customization Settings...');
  await settingsService.update(settingsData);
  console.log('  ✓ Storefront customization seeded successfully!');
}

async function runAllSeeds() {
  console.log('🚀 Initializing Full Dressing Shop Seed Process...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    await clearAllData(app);
    await seedAttributes(app);
    const brandMap = await seedBrands(app);
    const vendorMap = await seedVendors(app);
    const categoryMap = await seedCategories(app);
    const warehouses = await seedWarehouses(app);
    const products = await seedProducts(app, categoryMap, brandMap, vendorMap);
    await seedInventory(app, products, warehouses);
    await seedStorefrontSettings(app);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

void runAllSeeds();
