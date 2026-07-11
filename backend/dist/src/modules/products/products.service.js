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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const gst_util_1 = require("../../common/utils/gst.util");
const notifications_service_1 = require("../notifications/notifications.service");
let ProductsService = class ProductsService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async findAll() {
        const products = await this.prisma.product.findMany({
            where: { isDeleted: false },
            include: { category: true, unit: true },
            orderBy: { name: 'asc' },
        });
        return Promise.all(products.map(async (p) => ({
            ...p,
            price: Number(p.price),
            gstRate: Number(p.gstRate),
            lowStockThreshold: Number(p.lowStockThreshold),
            stock: await (0, gst_util_1.getProductStock)(this.prisma, p.id),
        })));
    }
    findCategories() {
        return this.prisma.productCategory.findMany({ orderBy: { name: 'asc' } });
    }
    findUnits() {
        return this.prisma.unit.findMany({ orderBy: { name: 'asc' } });
    }
    async create(data) {
        const product = await this.prisma.product.create({
            data: {
                name: data.name,
                categoryId: data.categoryId,
                unitId: data.unitId,
                price: data.price,
                hsnCode: data.hsnCode,
                gstRate: data.gstRate ?? 5,
                lowStockThreshold: data.lowStockThreshold ?? 10,
            },
            include: { category: true, unit: true },
        });
        await this.notifications.notifyByModule({
            module: 'products',
            type: 'PRODUCT_CREATED',
            title: 'New Product Added',
            message: `Product "${product.name}" added to catalogue`,
            refId: product.id,
            link: '/products',
            actorId: data.createdBy,
        });
        return product;
    }
    async update(id, data) {
        return this.prisma.product.update({
            where: { id },
            data,
            include: { category: true, unit: true },
        });
    }
    async remove(id) {
        return this.prisma.product.update({
            where: { id },
            data: { isDeleted: true, isActive: false },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], ProductsService);
//# sourceMappingURL=products.service.js.map