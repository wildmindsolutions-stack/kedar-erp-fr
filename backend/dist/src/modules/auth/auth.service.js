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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
            include: { role: true },
        });
        if (!user || !user.isActive || !user.role.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = { sub: user.id, email: user.email };
        const isPrivileged = ['Owner', 'Admin'].includes(user.role.name);
        const accessToken = isPrivileged
            ? this.jwt.sign(payload, { expiresIn: '7d' })
            : this.jwt.sign(payload, { expiresIn: '30m' });
        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role.name,
                permissions: user.role.permissions,
            },
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { role: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException();
        if (!user.role.isActive)
            throw new common_1.UnauthorizedException();
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name,
            permissions: user.role.permissions,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map