import { Module } from '@nestjs/common';
import { SettingsModule } from '../settings/settings.module';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [SettingsModule],
  controllers: [UploadsController],
  providers: [UploadsService],
})
export class UploadsModule {}
