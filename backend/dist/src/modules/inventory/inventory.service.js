"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const gst_util_1 = require("../../common/utils/gst.util");
const notifications_service_1 = require("../notifications/notifications.service");
let InventoryService = class InventoryService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async getStockSummary() {
        const products = await this.prisma.product.findMany({
            where: { isDeleted: false, isActive: true },
            include: { category: true, unit: true },
        });
        return Promise.all(products.map(async (p) => {
            const stock = await (0, gst_util_1.getProductStock)(this.prisma, p.id);
            const threshold = Number(p.lowStockThreshold);
            return {
                productId: p.id,
                productName: p.name,
                category: p.category.name,
                unit: p.unit.symbol,
                stock,
                lowStockThreshold: threshold,
                isLowStock: stock <= threshold,
            };
        }));
    }
    getLedger(productId) {
        return this.prisma.stockLedger.findMany({
            where: productId ? { productId } : undefined,
            include: { product: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
    async adjust(data) {
        const product = await this.prisma.product.findUnique({ where: { id: data.productId } });
        const entry = await this.prisma.stockLedger.create({
            data: {
                productId: data.productId,
                qtyChange: data.qtyChange,
                reason: 'ADJUSTMENT',
                notes: data.notes,
                createdBy: data.createdBy,
            },
        });
        const actor = data.createdBy
            ? await this.prisma.user.findUnique({ where: { id: data.createdBy } })
            : null;
        await this.notifications.notifyByModule({
            module: 'inventory',
            type: 'STOCK_ADJUSTED',
            title: 'Stock Adjustment',
            message: `${actor?.name || 'User'} adjusted ${product?.name} by ${data.qtyChange > 0 ? '+' : ''}${data.qtyChange}`,
            refId: entry.id,
            link: '/inventory',
            actorId: data.createdBy,
        });
        const stock = await (0, gst_util_1.getProductStock)(this.prisma, data.productId);
        if (product && stock <= Number(product.lowStockThreshold)) {
            await this.notifications.notifyByModule({
                module: 'inventory',
                type: 'LOW_STOCK',
                title: 'Low Stock Alert',
                message: `${product.name} is low on stock (${stock} remaining)`,
                refId: product.id,
                link: '/inventory',
                actorId: data.createdBy,
            });
        }
        return entry;
    }
    async transfer(data) {
        const [from, to] = await Promise.all([
            this.prisma.product.findUnique({ where: { id: data.fromProductId } }),
            this.prisma.product.findUnique({ where: { id: data.toProductId } }),
        ]);
        const result = await this.prisma.$transaction([
            this.prisma.stockLedger.create({
                data: {
                    productId: data.fromProductId,
                    qtyChange: -data.qty,
                    reason: 'TRANSFER_OUT',
                    notes: data.notes,
                    createdBy: data.createdBy,
                },
            }),
            this.prisma.stockLedger.create({
                data: {
                    productId: data.toProductId,
                    qtyChange: data.qty,
                    reason: 'TRANSFER_IN',
                    notes: data.notes,
                    createdBy: data.createdBy,
                },
            }),
        ]);
        await this.notifications.notifyByModule({
            module: 'inventory',
            type: 'STOCK_TRANSFER',
            title: 'Stock Transfer',
            message: `Transferred ${data.qty} from ${from?.name} to ${to?.name}`,
            link: '/inventory',
            actorId: data.createdBy,
        });
        return result;
    }
    async getLowStockAlerts() {
        const summary = await this.getStockSummary();
        return summary.filter((s) => s.isLowStock);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map