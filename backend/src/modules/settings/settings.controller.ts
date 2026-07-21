import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateBusinessSettingsDto } from './dto/settings.dto';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @RequirePermission('settings.read')
  @Get()
  get() {
    return this.settings.get();
  }

  @Public()
  @Get('public')
  getPublic() {
    return this.settings.getPublic();
  }

  @RequirePermission('settings.write')
  @Patch()
  update(@Body() dto: UpdateBusinessSettingsDto) {
    return this.settings.update(dto);
  }
}
