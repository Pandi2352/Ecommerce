import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRole, UserStatus } from '@ecommerce/shared';
import { buildMeta, type PaginatedMeta } from '../common/dto/pagination.dto';
import { User, UserDocument } from './schemas/user.schema';

export interface UserListQuery {
  page: number;
  pageSize: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly model: Model<UserDocument>) {}

  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
  }): Promise<UserDocument> {
    const exists = await this.model.exists({ email: data.email.toLowerCase() });
    if (exists) throw new ConflictException('Email already registered');
    return this.model.create(data);
  }

  /** Includes the password hash (for credential checks) — use only in auth. */
  findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.model.findById(id).exec();
  }

  findByIdWithPassword(id: string): Promise<UserDocument | null> {
    return this.model.findById(id).select('+password').exec();
  }

  count(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  async touchLastLogin(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { lastLogin: new Date() }).exec();
  }

  async updateProfile(id: string, data: { name?: string; email?: string }): Promise<UserDocument> {
    if (data.email) {
      const clash = await this.model.findOne({ email: data.email.toLowerCase(), _id: { $ne: id } });
      if (clash) throw new ConflictException('Email already in use');
    }
    const patch: Record<string, unknown> = {};
    if (data.name) patch.name = data.name;
    if (data.email) {
      patch.email = data.email.toLowerCase();
      patch.emailVerified = false;
    }
    return (await this.model.findByIdAndUpdate(id, patch, { new: true }).exec())!;
  }

  async setPassword(id: string, passwordHash: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { password: passwordHash }).exec();
  }

  async setEmailVerified(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { emailVerified: true }).exec();
  }

  // ── Admin management ──────────────────────────────────────────────────────

  async list(q: UserListQuery): Promise<{ data: UserDocument[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {};
    if (q.role) filter.role = q.role;
    if (q.status) filter.status = q.status;
    if (q.search) {
      filter.$or = [
        { name: { $regex: q.search, $options: 'i' } },
        { email: { $regex: q.search, $options: 'i' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((q.page - 1) * q.pageSize)
        .limit(q.pageSize)
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { data, meta: buildMeta(total, q.page, q.pageSize) };
  }

  async adminUpdate(
    id: string,
    patch: { name?: string; role?: UserRole; status?: UserStatus },
  ): Promise<UserDocument> {
    const doc = await this.model.findByIdAndUpdate(id, patch, { new: true }).exec();
    if (!doc) throw new NotFoundException('User not found');
    return doc;
  }

  setStatus(id: string, status: UserStatus): Promise<UserDocument> {
    return this.adminUpdate(id, { status });
  }

  /** For OAuth: find an existing user by email or create a verified one. */
  async findOrCreateOAuth(data: { email: string; name: string }): Promise<UserDocument> {
    const existing = await this.model.findOne({ email: data.email.toLowerCase() }).exec();
    if (existing) return existing;
    const first = (await this.count()) === 0;
    return this.model.create({
      email: data.email.toLowerCase(),
      name: data.name,
      password: '',
      emailVerified: true,
      role: first ? UserRole.ADMIN : UserRole.CUSTOMER,
    });
  }
}
