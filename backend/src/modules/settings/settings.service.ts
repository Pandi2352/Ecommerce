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

/** Fields excluded from the public /settings/public endpoint (no auth). */
const PUBLIC_EXCLUDE = [
  's3SecretAccessKey',
  's3AccessKeyId',
  's3Bucket',
  's3Region',
  'uploadDriver',
  'legalName',
  'address',
] as const;

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

  /**
   * Publicly accessible settings subset for the storefront.
   * Returns only safe, customer-facing fields (no S3 secrets, no internal config).
   */
  async getPublic(): Promise<Partial<BusinessSettings>> {
    const doc = await this.get();
    const obj = doc.toObject() as unknown as Record<string, unknown>;

    // Remove sensitive/internal fields
    for (const key of PUBLIC_EXCLUDE) {
      delete obj[key];
    }
    // Remove Mongoose internals
    delete obj.__v;
    delete obj._id;

    return obj;
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
