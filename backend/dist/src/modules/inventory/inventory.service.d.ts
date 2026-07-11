import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class InventoryService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    getStockSummary(): Promise<{
        productId: string;
        productName: string;
        category: string;
        unit: string;
        stock: number;
        lowStockThreshold: number;
        isLowStock: boolean;
    }[]>;
    getLedger(productId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        product: {
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
        notes: string | null;
        createdBy: string | null;
        qtyChange: import("@prisma/client/runtime/library").Decimal;
        reason: import(".prisma/client").$Enums.StockReason;
        refId: string | null;
    })[]>;
    adjust(data: {
        productId: string;
        qtyChange: number;
        notes?: string;
        createdBy?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        notes: string | null;
        createdBy: string | null;
        qtyChange: import("@prisma/client/runtime/library").Decimal;
        reason: import(".prisma/client").$Enums.StockReason;
        refId: string | null;
    }>;
    transfer(data: {
        fromProductId: string;
        toProductId: string;
        qty: number;
        notes?: string;
        createdBy?: string;
    }): Promise<[{
        id: string;
        createdAt: Date;
        productId: string;
        notes: string | null;
        createdBy: string | null;
        qtyChange: import("@prisma/client/runtime/library").Decimal;
        reason: import(".prisma/client").$Enums.StockReason;
        refId: string | null;
    }, {
        id: string;
        createdAt: Date;
        productId: string;
        notes: string | null;
        createdBy: string | null;
        qtyChange: import("@prisma/client/runtime/library").Decimal;
        reason: import(".prisma/client").$Enums.StockReason;
        refId: string | null;
    }]>;
    getLowStockAlerts(): Promise<{
        productId: string;
        productName: string;
        category: string;
        unit: string;
        stock: number;
        lowStockThreshold: number;
        isLowStock: boolean;
    }[]>;
}
