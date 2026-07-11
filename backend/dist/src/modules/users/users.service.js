"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../prisma/prisma.service");
const PROTECTED_ROLE_NAMES = ['Owner', 'Admin'];
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async create(data) {
        const role = await this.prisma.role.findUnique({ where: { id: data.roleId } });
        if (!role || !role.isActive) {
            throw new common_1.BadRequestException('Selected role is not available');
        }
        const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (existing) {
            throw new common_1.BadRequestException('A user with this email already exists');
        }
        const passwordHash = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: { name: data.name, email: data.email, passwordHash, roleId: data.roleId },
            include: { role: true },
        });
    }
    async update(actorId, id, data) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { role: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (data.isActive === false && id === actorId) {
            throw new common_1.BadRequestException('You cannot deactivate your own account');
        }
        if (data.roleId) {
            const role = await this.prisma.role.findUnique({ where: { id: data.roleId } });
            if (!role || !role.isActive) {
                throw new common_1.BadRequestException('Selected role is not available');
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
                throw new common_1.BadRequestException('A user with this email already exists');
            }
        }
        return this.prisma.user.update({
            where: { id },
            data,
            include: { role: true },
        });
    }
    async deactivate(actorId, id) {
        return this.update(actorId, id, { isActive: false });
    }
    async resetPassword(id, password) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const passwordHash = await bcrypt.hash(password, 10);
        return this.prisma.user.update({
            where: { id },
            data: { passwordHash },
            include: { role: true },
        });
    }
    async updateRole(roleId, data) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            include: { _count: { select: { users: true } } },
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        if (data.isActive === false) {
            if (PROTECTED_ROLE_NAMES.includes(role.name)) {
                throw new common_1.BadRequestException(`The ${role.name} role cannot be deactivated`);
            }
            if (role._count.users > 0) {
                throw new common_1.BadRequestException(`Cannot deactivate ${role.name} — ${role._count.users} user(s) still assigned. Reassign them first.`);
            }
        }
        return this.prisma.role.update({
            where: { id: roleId },
            data,
            include: { _count: { select: { users: true } } },
        });
    }
    async removeRole(roleId) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            include: { _count: { select: { users: true } } },
        });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        if (PROTECTED_ROLE_NAMES.includes(role.name)) {
            throw new common_1.BadRequestException(`The ${role.name} role cannot be removed`);
        }
        if (role._count.users > 0) {
            throw new common_1.BadRequestException(`Cannot remove ${role.name} — ${role._count.users} user(s) still assigned. Reassign them first.`);
        }
        await this.prisma.role.delete({ where: { id: roleId } });
        return { success: true, name: role.name };
    }
    async ensureAnotherActiveOwner(excludeUserId) {
        const otherOwners = await this.prisma.user.count({
            where: {
                id: { not: excludeUserId },
                isActive: true,
                role: { name: 'Owner' },
            },
        });
        if (otherOwners === 0) {
            throw new common_1.BadRequestException('At least one active Owner account must remain in the system');
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map