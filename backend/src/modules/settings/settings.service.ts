import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BusinessSettings,
  BusinessSettingsDocument,
  type UploadDriver,
} from './schemas/business-settings.schema';
import { UpdateBusinessSettingsDto } from './dto/settings.dto';

const SINGLETON_ID = 'business';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(BusinessSettings.name) private readonly model: Model<BusinessSettingsDocument>,
  ) {}

  /** The single business-settings document, created with defaults on first read. */
  async get(): Promise<BusinessSettingsDocument> {
    const existing = await this.model.findById(SINGLETON_ID).exec();
    return existing ?? this.model.create({ _id: SINGLETON_ID });
  }

  update(dto: UpdateBusinessSettingsDto): Promise<BusinessSettingsDocument> {
    return this.model
      .findByIdAndUpdate(SINGLETON_ID, dto, { new: true, upsert: true, setDefaultsOnInsert: true })
      .exec() as Promise<BusinessSettingsDocument>;
  }

  async uploadDriver(): Promise<UploadDriver> {
    const settings = await this.get();
    return settings.uploadDriver ?? 'local';
  }
}
