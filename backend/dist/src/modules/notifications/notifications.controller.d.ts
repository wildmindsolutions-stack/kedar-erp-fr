import { NotificationsService } from './notifications.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    findAll(user: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<({
        actor: {
            name: string;
            role: {
                name: string;
            };
        } | null;
    } & {
        id: string;
        createdAt: Date;
        createdBy: string | null;
        refId: string | null;
        userId: string;
        type: string;
        module: string;
        title: string;
        message: string;
        link: string | null;
        isRead: boolean;
    })[]>;
    getUnreadCount(user: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<number>;
    markAllRead(user: JwtPayload): import(".prisma/client").Prisma.PrismaPromise<import(".prisma/client").Prisma.BatchPayload>;
    markRead(user: JwtPayload, id: string): import(".prisma/client").Prisma.PrismaPromise<import(".prisma/client").Prisma.BatchPayload>;
}
