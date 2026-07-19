import { Injectable, NotImplementedException } from '@nestjs/common';
import type { Request } from 'express';
import { SettingsService } from '../settings/settings.service';
import { UPLOAD_ROUTE } from './uploads.constants';

@Injectable()
export class UploadsService {
  constructor(private readonly settings: SettingsService) {}

  /**
   * Turn a stored file into a public URL, honoring the configured driver.
   * `local` → served from disk at `/uploads`. `s3` → deferred (throws until wired).
   */
  async publicUrl(file: Express.Multer.File, req: Request): Promise<{ url: string; filename: string }> {
    const driver = await this.settings.uploadDriver();
    if (driver === 's3') {
      throw new NotImplementedException(
        'S3 storage is selected in Business Settings but not yet configured — switch to Local for now.',
      );
    }
    const host = `${req.protocol}://${req.get('host')}`;
    return { url: `${host}${UPLOAD_ROUTE}/${file.filename}`, filename: file.filename };
  }
}
