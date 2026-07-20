import { Body, Controller, Get, Post, Query, Request } from '@nestjs/common';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { AdjustStockDto, ListInventoryQueryDto, ListLedgerQueryDto, TransferStockDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @RequirePermission('inventory.read')
  @Get()
  list(@Query() query: ListInventoryQueryDto) {
    return this.inventory.list(query);
  }

  @RequirePermission('inventory.read')
  @Get('stats')
  stats() {
    return this.inventory.getStats();
  }

  @RequirePermission('inventory.read')
  @Get('low')
  lowStock(@Query() query: ListInventoryQueryDto) {
    return this.inventory.list({ ...query, stockStatus: 'LOW_STOCK' });
  }

  @RequirePermission('inventory.read')
  @Get('ledger')
  ledger(@Query() query: ListLedgerQueryDto) {
    return this.inventory.getLedger(query);
  }

  @RequirePermission('inventory.write')
  @Post('adjust')
  adjust(@Body() dto: AdjustStockDto, @Request() req: any) {
    return this.inventory.adjustStock(dto, req.user?.id || req.user?.email);
  }

  @RequirePermission('inventory.write')
  @Post('transfer')
  transfer(@Body() dto: TransferStockDto, @Request() req: any) {
    return this.inventory.transferStock(dto, req.user?.id || req.user?.email);
  }
}
