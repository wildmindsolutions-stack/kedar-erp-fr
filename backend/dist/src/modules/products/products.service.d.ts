import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class ProductsService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    findAll(): Promise<{
        price: number;
        gstRate: number;
        lowStockThreshold: number;
        stock: number;
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
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        categoryId: string;
        unitId: string;
        hsnCode: string;
        imageUrl: string | null;
        isDeleted: boolean;
    }[]>;
    findCategories(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        name: string;
        createdAt: Date;
    }[]>;
    findUnits(): import(".prisma/client").Prisma.PrismaPromise<{
        symbol: string;
        id: string;
        name: string;
        createdAt: Date;
    }[]>;
    create(data: {
        name: string;
        categoryId: string;
        unitId: string;
        price: number;
        hsnCode: string;
        gstRate?: number;
        lowStockThreshold?: number;
        createdBy?: string;
    }): Promise<{
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
    }>;
    update(id: string, data: Partial<{
        name: string;
        categoryId: string;
        unitId: string;
        price: number;
        hsnCode: string;
        gstRate: number;
        lowStockThreshold: number;
        isActive: boolean;
    }>): Promise<{
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
    }>;
    remove(id: string): Promise<{
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
    }>;
}
