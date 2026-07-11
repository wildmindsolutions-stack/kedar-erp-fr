"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const products_module_1 = require("./modules/products/products.module");
const customers_module_1 = require("./modules/customers/customers.module");
const manufacturing_module_1 = require("./modules/manufacturing/manufacturing.module");
const inventory_module_1 = require("./modules/inventory/inventory.module");
const sales_module_1 = require("./modules/sales/sales.module");
const payments_module_1 = require("./modules/payments/payments.module");
const delivery_module_1 = require("./modules/delivery/delivery.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            notifications_module_1.NotificationsModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            customers_module_1.CustomersModule,
            manufacturing_module_1.ManufacturingModule,
            inventory_module_1.InventoryModule,
            sales_module_1.SalesModule,
            payments_module_1.PaymentsModule,
            delivery_module_1.DeliveryModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map