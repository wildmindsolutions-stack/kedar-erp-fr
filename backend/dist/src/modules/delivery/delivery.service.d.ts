import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class DeliveryService {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    getAvailableInvoices(): Promise<({
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
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        invoice: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.DeliveryStatus;
        invoiceId: string;
        challanNo: string;
        vehicle: string | null;
        driverName: string | null;
        dispatchedAt: Date | null;
        deliveredAt: Date | null;
    })[]>;
    create(data: {
        invoiceId: string;
        vehicle?: string;
        driverName?: string;
        notes?: string;
        createdBy?: string;
    }): Promise<{
        invoice: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.DeliveryStatus;
        invoiceId: string;
        challanNo: string;
        vehicle: string | null;
        driverName: string | null;
        dispatchedAt: Date | null;
        deliveredAt: Date | null;
    }>;
    dispatch(id: string, data: {
        vehicle?: string;
        driverName?: string;
        actorId?: string;
    }): Promise<{
        invoice: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.DeliveryStatus;
        invoiceId: string;
        challanNo: string;
        vehicle: string | null;
        driverName: string | null;
        dispatchedAt: Date | null;
        deliveredAt: Date | null;
    }>;
    markDelivered(id: string, actorId?: string): Promise<{
        invoice: {
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
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        status: import(".prisma/client").$Enums.DeliveryStatus;
        invoiceId: string;
        challanNo: string;
        vehicle: string | null;
        driverName: string | null;
        dispatchedAt: Date | null;
        deliveredAt: Date | null;
    }>;
}
