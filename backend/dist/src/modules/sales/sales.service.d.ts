import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';
import { NotificationsService } from '../notifications/notifications.service';
export declare class SalesService {
    private prisma;
    private config;
    private notifications;
    constructor(prisma: PrismaService, config: ConfigService, notifications: NotificationsService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            isDeleted: boolean;
            gstin: string | null;
            phone: string | null;
            address: string | null;
            city: string | null;
            state: string;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
        };
        invoice: {
            id: string;
            createdAt: Date;
            isDeleted: boolean;
            financialYear: string;
            status: import(".prisma/client").$Enums.InvoiceStatus;
            orderId: string;
            invoiceNo: string;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            cgstAmount: import("@prisma/client/runtime/library").Decimal;
            sgstAmount: import("@prisma/client/runtime/library").Decimal;
            igstAmount: import("@prisma/client/runtime/library").Decimal;
            gstAmount: import("@prisma/client/runtime/library").Decimal;
            total: import("@prisma/client/runtime/library").Decimal;
            sellerGstin: string;
            buyerGstin: string | null;
            issuedAt: Date;
        } | null;
        items: ({
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
            productId: string;
            orderId: string;
            qty: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdBy: string | null;
        customerId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        orderDate: Date;
    })[]>;
    findInvoices(): import(".prisma/client").Prisma.PrismaPromise<({
        items: ({
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
            hsnCode: string;
            gstRate: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            qty: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
            taxable: import("@prisma/client/runtime/library").Decimal;
            cgst: import("@prisma/client/runtime/library").Decimal;
            sgst: import("@prisma/client/runtime/library").Decimal;
            igst: import("@prisma/client/runtime/library").Decimal;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
            invoiceId: string;
        })[];
        order: {
            customer: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                isDeleted: boolean;
                gstin: string | null;
                phone: string | null;
                address: string | null;
                city: string | null;
                state: string;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            createdBy: string | null;
            customerId: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            orderDate: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        isDeleted: boolean;
        financialYear: string;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        orderId: string;
        invoiceNo: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        cgstAmount: import("@prisma/client/runtime/library").Decimal;
        sgstAmount: import("@prisma/client/runtime/library").Decimal;
        igstAmount: import("@prisma/client/runtime/library").Decimal;
        gstAmount: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        sellerGstin: string;
        buyerGstin: string | null;
        issuedAt: Date;
    })[]>;
    createOrder(data: {
        customerId: string;
        orderDate: string;
        notes?: string;
        items: {
            productId: string;
            qty: number;
            rate: number;
        }[];
        createdBy?: string;
    }): Promise<{
        customer: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            isDeleted: boolean;
            gstin: string | null;
            phone: string | null;
            address: string | null;
            city: string | null;
            state: string;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
        };
        items: ({
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
            productId: string;
            orderId: string;
            qty: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdBy: string | null;
        customerId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        orderDate: Date;
    }>;
    confirmOrder(orderId: string, userId: string): Promise<{
        items: ({
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
            hsnCode: string;
            gstRate: import("@prisma/client/runtime/library").Decimal;
            productId: string;
            qty: import("@prisma/client/runtime/library").Decimal;
            rate: import("@prisma/client/runtime/library").Decimal;
            taxable: import("@prisma/client/runtime/library").Decimal;
            cgst: import("@prisma/client/runtime/library").Decimal;
            sgst: import("@prisma/client/runtime/library").Decimal;
            igst: import("@prisma/client/runtime/library").Decimal;
            lineTotal: import("@prisma/client/runtime/library").Decimal;
            invoiceId: string;
        })[];
        order: {
            customer: {
                id: string;
                name: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                isDeleted: boolean;
                gstin: string | null;
                phone: string | null;
                address: string | null;
                city: string | null;
                state: string;
                creditLimit: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            notes: string | null;
            createdBy: string | null;
            customerId: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            orderDate: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        isDeleted: boolean;
        financialYear: string;
        status: import(".prisma/client").$Enums.InvoiceStatus;
        orderId: string;
        invoiceNo: string;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        cgstAmount: import("@prisma/client/runtime/library").Decimal;
        sgstAmount: import("@prisma/client/runtime/library").Decimal;
        igstAmount: import("@prisma/client/runtime/library").Decimal;
        gstAmount: import("@prisma/client/runtime/library").Decimal;
        total: import("@prisma/client/runtime/library").Decimal;
        sellerGstin: string;
        buyerGstin: string | null;
        issuedAt: Date;
    }>;
    cancelOrder(orderId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        notes: string | null;
        createdBy: string | null;
        customerId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        orderDate: Date;
    }>;
    generateInvoicePdf(invoiceId: string, res: Response): Promise<void>;
}
