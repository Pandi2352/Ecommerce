import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SUPER_ADMIN_ROLE, UserStatus } from '@ecommerce/shared';
import type { PaginatedMeta } from '../../common/dto/pagination.dto';
import { BaseService } from '../../common/services/base.service';
import { buildSearchFilter, parseSort } from '../../common/utils';
import { User, UserDocument } from './schemas/user.schema';

export interface UserListQuery {
  page: number;
  pageSize: number;
  search?: string;
  sort?: string;
  role?: string;
  status?: UserStatus;
  verified?: string;
}

export type BulkAction = 'ban' | 'restore' | 'delete' | 'setRole';

@Injectable()
export class UsersService extends BaseService<UserDocument> {
  constructor(@InjectModel(User.name) model: Model<UserDocument>) {
    super(model, 'User');
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: string;
    status?: UserStatus;
    invitedAt?: Date;
    inviteExpiresAt?: Date;
    invitedBy?: string;
  }): Promise<UserDocument> {
    const exists = await this.model.exists({ email: data.email.toLowerCase() });
    if (exists) throw new ConflictException('Email already registered');
    return this.model.create(data);
  }

  /** Refresh the invite window (used on re-invite). */
  async setInvite(
    id: string,
    fields: { invitedAt: Date; inviteExpiresAt: Date; invitedBy?: string },
  ): Promise<void> {
    await this.model.findByIdAndUpdate(id, fields).exec();
  }

  /** Hard-delete a record (used to revoke a pending invite that never activated). */
  async hardDelete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
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

  list(q: UserListQuery): Promise<{ data: UserDocument[]; meta: PaginatedMeta }> {
    const filter: Record<string, unknown> = {
      ...buildSearchFilter(['name', 'email'], q.search),
    };
    if (q.role) filter.role = q.role;
    if (q.status) filter.status = q.status;
    if (q.verified === 'true' || q.verified === 'false') filter.emailVerified = q.verified === 'true';
    return this.paginate({
      filter,
      sort: parseSort(q.sort),
      page: q.page,
      pageSize: q.pageSize,
    });
  }

  /** Aggregate counts for the dashboard cards on the Users page. */
  async stats(): Promise<{
    total: number;
    active: number;
    invited: number;
    banned: number;
    suspended: number;
    deleted: number;
    verified: number;
    unverified: number;
    byRole: Array<{ role: string; count: number }>;
  }> {
    const [byStatus, byRole, verified, total] = await Promise.all([
      this.model.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.model.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      this.model.countDocuments({ emailVerified: true }).exec(),
      this.model.countDocuments().exec(),
    ]);
    const s = Object.fromEntries(byStatus.map((r) => [r._id, r.count])) as Record<string, number>;
    return {
      total,
      active: s[UserStatus.ACTIVE] ?? 0,
      invited: s[UserStatus.INVITED] ?? 0,
      banned: s[UserStatus.BANNED] ?? 0,
      suspended: s[UserStatus.SUSPENDED] ?? 0,
      deleted: s[UserStatus.DELETED] ?? 0,
      verified,
      unverified: total - verified,
      byRole: byRole
        .map((r) => ({ role: r._id, count: r.count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  /** Throw if the target is a Super Admin — those accounts can't be banned/deleted/re-roled. */
  async assertMutable(id: string): Promise<void> {
    const user = await this.model.findById(id).select('role').exec();
    if (user?.role === SUPER_ADMIN_ROLE) {
      throw new ForbiddenException('Super Admin accounts are protected');
    }
  }

  /** Apply an action to many users at once (excludes `excludeId` and any Super Admin). */
  async bulk(
    ids: string[],
    action: BulkAction,
    role: string | undefined,
    excludeId?: string,
  ): Promise<{ affected: number }> {
    let targets = excludeId ? ids.filter((id) => id !== excludeId) : ids;
    // Never let a bulk action touch a Super Admin.
    const supers = await this.model
      .find({ _id: { $in: targets }, role: SUPER_ADMIN_ROLE })
      .select('_id')
      .exec();
    if (supers.length) {
      const superIds = new Set(supers.map((s) => String(s._id)));
      targets = targets.filter((id) => !superIds.has(id));
    }
    if (targets.length === 0) return { affected: 0 };
    const filter = { _id: { $in: targets } };
    if (action === 'setRole') {
      if (!role) throw new BadRequestException('role is required for setRole');
      const res = await this.model.updateMany(filter, { role }).exec();
      return { affected: res.modifiedCount };
    }
    const status =
      action === 'ban'
        ? UserStatus.BANNED
        : action === 'restore'
          ? UserStatus.ACTIVE
          : UserStatus.DELETED;
    const res = await this.model.updateMany(filter, { status }).exec();
    return { affected: res.modifiedCount };
  }

  async adminUpdate(
    id: string,
    patch: { name?: string; role?: string; status?: UserStatus },
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
      role: first ? SUPER_ADMIN_ROLE : 'Customer',
    });
  }
}
