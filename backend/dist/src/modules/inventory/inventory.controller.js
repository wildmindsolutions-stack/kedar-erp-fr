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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const inventory_service_1 = require("./inventory.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permission_decorator_1 = require("../../common/decorators/require-permission.decorator");
const permissions_1 = require("../../common/permissions");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    getStockSummary() {
        return this.inventoryService.getStockSummary();
    }
    getLedger(productId) {
        return this.inventoryService.getLedger(productId);
    }
    getLowStockAlerts() {
        return this.inventoryService.getLowStockAlerts();
    }
    adjust(body, user) {
        return this.inventoryService.adjust({ ...body, createdBy: user.sub });
    }
    transfer(body, user) {
        return this.inventoryService.transfer({ ...body, createdBy: user.sub });
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.INVENTORY_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getStockSummary", null);
__decorate([
    (0, common_1.Get)('ledger'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.INVENTORY_READ),
    __param(0, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getLedger", null);
__decorate([
    (0, common_1.Get)('alerts'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.INVENTORY_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "getLowStockAlerts", null);
__decorate([
    (0, common_1.Post)('adjust'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.INVENTORY_WRITE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "adjust", null);
__decorate([
    (0, common_1.Post)('transfer'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.INVENTORY_WRITE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "transfer", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map