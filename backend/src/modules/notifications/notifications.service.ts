import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { canAccessModule } from '../../common/permissions';

export interface NotifyPayload {
  module: string;
  type: string;
  title: string;
  message: string;
  refId?: string;
  link?: string;
  actorId?: string;
  /** Always notify Owner/Admin even if they lack module permission */
  notifyAdmins?: boolean;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async notifyByModule(payload: NotifyPayload) {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      include: { role: true },
    });

    const recipients = users.filter((u) => {
      if (u.id === payload.actorId) return false;
      const perms = (u.role.permissions as string[]) || [];
      if (u.role.name === 'Owner' || u.role.name === 'Admin') return true;
      return canAccessModule(u.role.name, perms, payload.module);
    });

    if (!recipients.length) return [];

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

  getForUser(userId: string, limit = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      include: { actor: { select: { name: true, role: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  getUnreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
