import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { DiscountsService } from './discounts.service';
import {
  BatchGenerateCodesDto,
  CreateCouponDto,
  ListDiscountsQueryDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/discount.dto';

@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discounts: DiscountsService) {}

  @RequirePermission('discounts.read')
  @Get()
  list(@Query() query: ListDiscountsQueryDto) {
    return this.discounts.list(query);
  }

  @RequirePermission('discounts.read')
  @Get('stats')
  stats() {
    return this.discounts.getStats();
  }

  @RequirePermission('discounts.read')
  @Get(':id')
  get(@Param('id') id: string) {
    return this.discounts.findById(id);
  }

  @RequirePermission('discounts.write')
  @Post()
  create(@Body() dto: CreateCouponDto) {
    return this.discounts.create(dto);
  }

  @RequirePermission('discounts.write')
  @Post('batch-generate')
  batchGenerate(@Body() dto: BatchGenerateCodesDto) {
    return this.discounts.batchGenerate(dto);
  }

  @RequirePermission('discounts.write')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
    return this.discounts.update(id, dto);
  }

  @RequirePermission('discounts.write')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.discounts.remove(id);
  }

  @Public()
  @Post('validate')
  validate(@Body() dto: ValidateCouponDto, @Request() req: any) {
    return this.discounts.validateCoupon(dto, req.user?.id);
  }
}
