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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const sales_service_1 = require("./sales.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permission_decorator_1 = require("../../common/decorators/require-permission.decorator");
const permissions_1 = require("../../common/permissions");
let SalesController = class SalesController {
    constructor(salesService) {
        this.salesService = salesService;
    }
    findOrders() {
        return this.salesService.findAll();
    }
    findInvoices() {
        return this.salesService.findInvoices();
    }
    createOrder(body, user) {
        return this.salesService.createOrder({ ...body, createdBy: user.sub });
    }
    confirmOrder(id, user) {
        if (!(0, permissions_1.canConfirmSalesOrders)(user.role)) {
            throw new common_1.ForbiddenException('Only Accountant or Manager can confirm orders and generate invoices');
        }
        return this.salesService.confirmOrder(id, user.sub);
    }
    cancelOrder(id) {
        return this.salesService.cancelOrder(id);
    }
    async getInvoicePdf(id, res) {
        return this.salesService.generateInvoicePdf(id, res);
    }
};
exports.SalesController = SalesController;
__decorate([
    (0, common_1.Get)('orders'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.SALES_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findOrders", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.SALES_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "findInvoices", null);
__decorate([
    (0, common_1.Post)('orders'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.SALES_WRITE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/confirm'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.SALES_WRITE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "confirmOrder", null);
__decorate([
    (0, common_1.Post)('orders/:id/cancel'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.SALES_WRITE),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SalesController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Get)('invoices/:id/pdf'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.SALES_READ),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SalesController.prototype, "getInvoicePdf", null);
exports.SalesController = SalesController = __decorate([
    (0, common_1.Controller)('sales'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [sales_service_1.SalesService])
], SalesController);
//# sourceMappingURL=sales.controller.js.map