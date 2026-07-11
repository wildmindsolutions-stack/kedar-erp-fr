import { InventoryService } from './inventory.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class InventoryController {
    private inventoryService;
    constructor(inventoryService: InventoryService);
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
    getLowStockAlerts(): Promise<{
        productId: string;
        productName: string;
        category: string;
        unit: string;
        stock: number;
        lowStockThreshold: number;
        isLowStock: boolean;
    }[]>;
    adjust(body: {
        productId: string;
        qtyChange: number;
        notes?: string;
    }, user: JwtPayload): Promise<{
        id: string;
        createdAt: Date;
        productId: string;
        notes: string | null;
        createdBy: string | null;
        qtyChange: import("@prisma/client/runtime/library").Decimal;
        reason: import(".prisma/client").$Enums.StockReason;
        refId: string | null;
    }>;
    transfer(body: {
        fromProductId: string;
        toProductId: string;
        qty: number;
        notes?: string;
    }, user: JwtPayload): Promise<[{
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
}
