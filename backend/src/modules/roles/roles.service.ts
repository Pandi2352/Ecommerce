import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ALL_PERMISSIONS, SUPER_ADMIN_ROLE } from '@ecommerce/shared';
import { BaseService } from '../../common/services/base.service';
import { UsersService } from '../users/users.service';
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService extends BaseService<RoleDocument> implements OnModuleInit {
  constructor(
    @InjectModel(Role.name) model: Model<RoleDocument>,
    private readonly users: UsersService,
  ) {
    super(model, 'Role');
  }

  /** Ensure the built-in roles exist on every boot. */
  onModuleInit(): Promise<void> {
    return this.seedDefaults();
  }

  findAll(): Promise<RoleDocument[]> {
    return this.model.find().sort({ isSystem: -1, name: 1 }).exec();
  }

  findByName(name: string): Promise<RoleDocument | null> {
    return this.model.findOne({ name }).exec();
  }

  findOne(id: string): Promise<RoleDocument> {
    return this.findByIdOrThrow(id);
  }

  async create(dto: CreateRoleDto): Promise<RoleDocument> {
    if (await this.model.exists({ name: dto.name })) {
      throw new ConflictException('A role with that name already exists');
    }
    return this.model.create({ ...dto, isSystem: false });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<RoleDocument> {
    const role = await this.findOne(id);
    if (role.isSystem) throw new BadRequestException('System roles cannot be edited');
    if (dto.name && dto.name !== role.name && (await this.model.exists({ name: dto.name }))) {
      throw new ConflictException('A role with that name already exists');
    }
    Object.assign(role, dto);
    return role.save();
  }

  async remove(id: string): Promise<{ id: string }> {
    const role = await this.findOne(id);
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');
    const inUse = await this.users.countByRole(role.name);
    if (inUse > 0) {
      throw new ConflictException(
        `Cannot delete "${role.name}" — ${inUse} user${inUse === 1 ? '' : 's'} still ${inUse === 1 ? 'has' : 'have'} this role. Reassign them first.`,
      );
    }
    await role.deleteOne();
    return { id };
  }

  /** Make one role the invite default (unsets the previous default). System roles allowed. */
  async setDefault(id: string): Promise<RoleDocument> {
    const role = await this.findByIdOrThrow(id);
    await this.model.updateMany({ isDefault: true }, { isDefault: false }).exec();
    role.isDefault = true;
    return role.save();
  }

  /** The current default role (falls back to any non-system role, else the first). */
  async getDefault(): Promise<RoleDocument | null> {
    return (await this.model.findOne({ isDefault: true }).exec()) ?? null;
  }

  /** Resolve the permission set for a role name (super admin → everything). */
  async permissionsFor(roleName: string): Promise<string[]> {
    if (roleName === SUPER_ADMIN_ROLE) return ALL_PERMISSIONS;
    const role = await this.findByName(roleName);
    return role?.permissions ?? [];
  }

  /** Seed the built-in roles (idempotent). */
  async seedDefaults(): Promise<void> {
    const defaults: Array<Pick<Role, 'name' | 'description' | 'permissions' | 'isSystem' | 'isDefault'>> = [
      {
        name: SUPER_ADMIN_ROLE,
        description: 'Full access to everything. Cannot be edited or deleted.',
        permissions: ALL_PERMISSIONS,
        isSystem: true,
        isDefault: false,
      },
      {
        name: 'Admin',
        description: 'Manage the store, but not roles.',
        permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith('roles.')),
        isSystem: false,
        isDefault: true,
      },
      {
        name: 'Customer',
        description: 'Storefront shopper — no admin access.',
        permissions: [],
        isSystem: false,
        isDefault: false,
      },
    ];
    for (const r of defaults) {
      await this.model.updateOne({ name: r.name }, { $setOnInsert: r }, { upsert: true }).exec();
    }
    // Self-heal: guarantee exactly one default (also upgrades data seeded before `isDefault` existed).
    if (!(await this.model.exists({ isDefault: true }))) {
      await this.model.updateOne({ name: 'Admin' }, { isDefault: true }).exec();
    }
  }
}
