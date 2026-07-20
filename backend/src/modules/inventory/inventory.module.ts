import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Warehouse, WarehouseSchema } from '../warehouses/schemas/warehouse.schema';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryRecord, InventoryRecordSchema } from './schemas/inventory-record.schema';
import { StockAdjustment, StockAdjustmentSchema } from './schemas/stock-adjustment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryRecord.name, schema: InventoryRecordSchema },
      { name: StockAdjustment.name, schema: StockAdjustmentSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
