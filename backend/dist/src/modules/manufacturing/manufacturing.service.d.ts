import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ManufacturingService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        product: {
            unit: {
                symbol: string;
                id: string;
                name: string;
                createdAt: Date;
            };
            category: {
                id: string;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            unitId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            hsnCode: string;
            gstRate: import("@prisma/client/runtime/library").Decimal;
            imageUrl: string | null;
            lowStockThreshold: import("@prisma/client/runtime/library").Decimal;
            isDeleted: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        productId: string;
        batchNo: string;
        batchDate: Date;
        qtyProduced: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdBy: string | null;
    })[]>;
    create(data: {
        productId: string;
        batchNo: string;
        batchDate: string;
        qtyProduced: number;
        notes?: string;
        createdBy?: string;
    }): Promise<{
        product: {
            unit: {
                symbol: string;
                id: string;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            categoryId: string;
            unitId: string;
            price: import("@prisma/client/runtime/library").Decimal;
            hsnCode: string;
            gstRate: import("@prisma/client/runtime/library").Decimal;
            imageUrl: string | null;
            lowStockThreshold: import("@prisma/client/runtime/library").Decimal;
            isDeleted: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        productId: string;
        batchNo: string;
        batchDate: Date;
        qtyProduced: import("@prisma/client/runtime/library").Decimal;
        notes: string | null;
        createdBy: string | null;
    }>;
    getYieldReport(): Promise<{
        product: string;
        totalQty: number;
        batches: number;
    }[]>;
}
