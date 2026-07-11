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
exports.DeliveryController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const delivery_service_1 = require("./delivery.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permission_decorator_1 = require("../../common/decorators/require-permission.decorator");
const permissions_1 = require("../../common/permissions");
let DeliveryController = class DeliveryController {
    constructor(deliveryService) {
        this.deliveryService = deliveryService;
    }
    getAvailableInvoices() {
        return this.deliveryService.getAvailableInvoices();
    }
    findAll() {
        return this.deliveryService.findAll();
    }
    create(body, user) {
        return this.deliveryService.create({ ...body, createdBy: user.sub });
    }
    dispatch(id, body, user) {
        return this.deliveryService.dispatch(id, { ...body, actorId: user.sub });
    }
    markDelivered(id, user) {
        return this.deliveryService.markDelivered(id, user.sub);
    }
};
exports.DeliveryController = DeliveryController;
__decorate([
    (0, common_1.Get)('invoices'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.DELIVERY_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "getAvailableInvoices", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.DELIVERY_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.DELIVERY_WRITE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id/dispatch'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.DELIVERY_WRITE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "dispatch", null);
__decorate([
    (0, common_1.Patch)(':id/delivered'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.DELIVERY_WRITE),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], DeliveryController.prototype, "markDelivered", null);
exports.DeliveryController = DeliveryController = __decorate([
    (0, common_1.Controller)('delivery'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [delivery_service_1.DeliveryService])
], DeliveryController);
//# sourceMappingURL=delivery.controller.js.map