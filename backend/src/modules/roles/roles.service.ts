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
import { Role, RoleDocument } from './schemas/role.schema';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService extends BaseService<RoleDocument> implements OnModuleInit {
  constructor(@InjectModel(Role.name) model: Model<RoleDocument>) {
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
    await role.deleteOne();
    return { id };
  }

  /** Resolve the permission set for a role name (super admin → everything). */
  async permissionsFor(roleName: string): Promise<string[]> {
    if (roleName === SUPER_ADMIN_ROLE) return ALL_PERMISSIONS;
    const role = await this.findByName(roleName);
    return role?.permissions ?? [];
  }

  /** Seed the built-in roles (idempotent). */
  async seedDefaults(): Promise<void> {
    const defaults: Array<Pick<Role, 'name' | 'description' | 'permissions' | 'isSystem'>> = [
      {
        name: SUPER_ADMIN_ROLE,
        description: 'Full access to everything. Cannot be edited or deleted.',
        permissions: ALL_PERMISSIONS,
        isSystem: true,
      },
      {
        name: 'Admin',
        description: 'Manage the store, but not roles.',
        permissions: ALL_PERMISSIONS.filter((p) => !p.startsWith('roles.')),
        isSystem: false,
      },
      {
        name: 'Customer',
        description: 'Storefront shopper — no admin access.',
        permissions: [],
        isSystem: false,
      },
    ];
    for (const r of defaults) {
      await this.model.updateOne({ name: r.name }, { $setOnInsert: r }, { upsert: true }).exec();
    }
  }
}
