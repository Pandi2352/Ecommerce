import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from '../backend/src/app.module';
import { CategoriesService } from '../backend/src/modules/categories/categories.service';
import { ProductsService } from '../backend/src/modules/products/products.service';
import { ProductStatus } from '@ecommerce/shared';

/** Size & Color Variant Matrix Generator for Clothing Items */
const SIZE_OPTION = { name: 'Size', values: ['S', 'M', 'L', 'XL'] };
const COLOR_OPTION = (colors: string[]) => ({ name: 'Color', values: colors });

const buildVariants = (basePrice: number, colors: string[]) =>
  SIZE_OPTION.values.flatMap((size) =>
    colors.map((color) => ({
      sku: `CLOTH-${size}-${color}`.toUpperCase(),
      optionValues: { Size: size, Color: color },
      price: basePrice,
      stock: 15,
      isActive: true,
    })),
  );

export async function seedCategories(appContext: any) {
  const categoriesService = appContext.get(CategoriesService);
  const jsonPath = path.join(__dirname, 'categories.seed.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const categoriesList = JSON.parse(rawData);

  console.log('\n📦 [Seed Call 1/2] Seeding 10 Dressing Shop Categories...');
  const categoryMap = new Map<string, string>(); // slug -> category ID

  for (const catDto of categoriesList) {
    try {
      const created = await categoriesService.create(catDto);
      categoryMap.set(catDto.slug, String((created as any)._id));
      console.log(`  ✓ Category created: ${catDto.name} (${catDto.slug})`);
    } catch (err: any) {
      if (err?.message?.includes('already exists')) {
        const existing = await categoriesService.findAll();
        const found = existing.find((c: any) => c.slug === catDto.slug);
        if (found) {
          categoryMap.set(catDto.slug, String(found._id));
          console.log(`  ✓ Category already present: ${catDto.name} (${catDto.slug})`);
        }
      } else {
        console.warn(`  ⚠️ Category error (${catDto.slug}):`, err?.message);
      }
    }
  }

  return categoryMap;
}

export async function seedProducts(appContext: any, categoryMap: Map<string, string>) {
  const productsService = appContext.get(ProductsService);
  const jsonPath = path.join(__dirname, 'products.seed.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const productsList = JSON.parse(rawData);

  console.log('\n👗 [Seed Call 2/2] Seeding 20 Dressing Shop Products...');
  let count = 0;

  for (const item of productsList) {
    const { categorySlug, ...productData } = item;
    const categoryId = categoryMap.get(categorySlug);

    // Build clothing options & variant matrix
    const colors = ['Black', 'Navy', 'Maroon', 'Beige'];
    const options = [SIZE_OPTION, COLOR_OPTION(colors)];
    const variants = buildVariants(productData.price, colors);

    try {
      await productsService.create({
        ...productData,
        category: categoryId || undefined,
        options,
        variants,
        status: ProductStatus.ACTIVE,
      });
      count++;
      console.log(`  ✓ Product seeded (${count}/20): ${productData.name}`);
    } catch (err: any) {
      console.warn(`  ⚠️ Product error (${productData.name}):`, err?.message);
    }
  }

  console.log(`\n🎉 Successfully seeded ${count} Dressing Shop products into DB!`);
}

async function runAllSeeds() {
  console.log('🚀 Initializing Dressing Shop Seed Script...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const categoryMap = await seedCategories(app);
    await seedProducts(app, categoryMap);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await app.close();
    process.exit(0);
  }
}

if (require.main === module) {
  void runAllSeeds();
}
