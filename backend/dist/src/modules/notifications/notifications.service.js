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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const permissions_1 = require("../../common/permissions");
let NotificationsService = class NotificationsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async notifyByModule(payload) {
        const users = await this.prisma.user.findMany({
            where: { isActive: true },
            include: { role: true },
        });
        const recipients = users.filter((u) => {
            if (u.id === payload.actorId)
                return false;
            const perms = u.role.permissions || [];
            if (u.role.name === 'Owner' || u.role.name === 'Admin')
                return true;
            return (0, permissions_1.canAccessModule)(u.role.name, perms, payload.module);
        });
        if (!recipients.length)
            return [];
        return this.prisma.notification.createMany({
            data: recipients.map((u) => ({
                userId: u.id,
                type: payload.type,
                module: payload.module,
                title: payload.title,
                message: payload.message,
                refId: payload.refId,
                link: payload.link,
                createdBy: payload.actorId,
            })),
        });
    }
    getForUser(userId, limit = 30) {
        return this.prisma.notification.findMany({
            where: { userId },
            include: { actor: { select: { name: true, role: { select: { name: true } } } } },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    getUnreadCount(userId) {
        return this.prisma.notification.count({ where: { userId, isRead: false } });
    }
    markRead(userId, id) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }
    markAllRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map