import { ManufacturingService } from './manufacturing.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class ManufacturingController {
    private manufacturingService;
    constructor(manufacturingService: ManufacturingService);
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
    getYieldReport(): Promise<{
        product: string;
        totalQty: number;
        batches: number;
    }[]>;
    create(body: {
        productId: string;
        batchNo: string;
        batchDate: string;
        qtyProduced: number;
        notes?: string;
    }, user: JwtPayload): Promise<{
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
}
