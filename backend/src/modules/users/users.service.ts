import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

const PROTECTED_ROLE_NAMES = ['Owner', 'Admin'];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findRoles() {
    return this.prisma.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; email: string; password: string; roleId: string }) {
    const role = await this.prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role || !role.isActive) {
      throw new BadRequestException('Selected role is not available');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: { name: data.name, email: data.email, passwordHash, roleId: data.roleId },
      include: { role: true },
    });
  }

  async update(
    actorId: string,
    id: string,
    data: { name?: string; email?: string; roleId?: string; isActive?: boolean },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (data.isActive === false && id === actorId) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    if (data.roleId) {
      const role = await this.prisma.role.findUnique({ where: { id: data.roleId } });
      if (!role || !role.isActive) {
        throw new BadRequestException('Selected role is not available');
      }
    }

    const targetRoleName = data.roleId
      ? (await this.prisma.role.findUnique({ where: { id: data.roleId } }))?.name
      : user.role.name;

    const willBeInactive = data.isActive === false;
    const leavingOwnerRole = user.role.name === 'Owner' && (willBeInactive || targetRoleName !== 'Owner');

    if (leavingOwnerRole) {
      await this.ensureAnotherActiveOwner(id);
    }

    if (data.email && data.email !== user.email) {
      const duplicate = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('A user with this email already exists');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async deactivate(actorId: string, id: string) {
    return this.update(actorId, id, { isActive: false });
  }

  async resetPassword(id: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
      include: { role: true },
    });
  }

  async updateRole(
    roleId: string,
    data: { isActive?: boolean },
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (data.isActive === false) {
      if (PROTECTED_ROLE_NAMES.includes(role.name)) {
        throw new BadRequestException(`The ${role.name} role cannot be deactivated`);
      }
      if (role._count.users > 0) {
        throw new BadRequestException(
          `Cannot deactivate ${role.name} — ${role._count.users} user(s) still assigned. Reassign them first.`,
        );
      }
    }

    return this.prisma.role.update({
      where: { id: roleId },
      data,
      include: { _count: { select: { users: true } } },
    });
  }

  async removeRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');

    if (PROTECTED_ROLE_NAMES.includes(role.name)) {
      throw new BadRequestException(`The ${role.name} role cannot be removed`);
    }

    if (role._count.users > 0) {
      throw new BadRequestException(
        `Cannot remove ${role.name} — ${role._count.users} user(s) still assigned. Reassign them first.`,
      );
    }

    await this.prisma.role.delete({ where: { id: roleId } });
    return { success: true, name: role.name };
  }

  private async ensureAnotherActiveOwner(excludeUserId: string) {
    const otherOwners = await this.prisma.user.count({
      where: {
        id: { not: excludeUserId },
        isActive: true,
        role: { name: 'Owner' },
      },
    });
    if (otherOwners === 0) {
      throw new BadRequestException('At least one active Owner account must remain in the system');
    }
  }
}
