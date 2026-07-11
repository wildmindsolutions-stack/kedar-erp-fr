import { PrismaService } from '../../prisma/prisma.service';
export interface RoleTask {
    id: string;
    title: string;
    message: string;
    href: string;
    actionLabel: string;
    count: number;
    priority: 'high' | 'normal';
}
export declare class DashboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getStats(role: string, permissions: string[]): Promise<{
        role: string;
        todayProduction: number | null;
        todaySales: number | null;
        todayInvoiceCount: number | null;
        monthlyRevenue: number | null;
        pendingPayments: number | null;
        totalProducts: number | null;
        lowStockCount: number | null;
        pendingDeliveries: number | null;
        dispatchedDeliveries: number | null;
        invoicesAwaitingChallanCount: number | null;
        draftOrdersCount: number | null;
        bestSellingProducts: {
            productId: string;
            productName: string;
            totalQty: number;
        }[];
        lowStockItems: {
            productName: string;
            stock: number;
            unit: string;
            threshold: number;
        }[];
        invoicesAwaitingChallan: {
            id: string;
            invoiceNo: string;
            customerName: string;
            total: number;
            issuedAt: Date;
        }[];
        draftOrders: {
            id: string;
            orderDate: Date;
            customerName: string;
            itemCount: number;
            subtotal: number;
        }[];
        salesTrend: {
            date: string;
            sales: number;
        }[];
        recentActivity: ({
            id: string;
            type: "audit";
            title: string;
            message: string;
            time: Date;
            module: string;
        } | {
            id: string;
            type: "notification";
            title: string;
            message: string;
            module: string;
            time: Date;
        })[];
        roleTasks: RoleTask[];
    }>;
    private buildRoleTasks;
    private getInvoicesAwaitingChallan;
    private getDraftOrders;
    private getLowStockItems;
    private getSalesTrend;
    private getRecentActivity;
    private formatAuditTitle;
}
