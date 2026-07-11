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
exports.ManufacturingController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const manufacturing_service_1 = require("./manufacturing.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permission_decorator_1 = require("../../common/decorators/require-permission.decorator");
const permissions_1 = require("../../common/permissions");
let ManufacturingController = class ManufacturingController {
    constructor(manufacturingService) {
        this.manufacturingService = manufacturingService;
    }
    findAll() {
        return this.manufacturingService.findAll();
    }
    getYieldReport() {
        return this.manufacturingService.getYieldReport();
    }
    create(body, user) {
        return this.manufacturingService.create({ ...body, createdBy: user.sub });
    }
};
exports.ManufacturingController = ManufacturingController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.MANUFACTURING_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ManufacturingController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('yield'),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.MANUFACTURING_READ),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ManufacturingController.prototype, "getYieldReport", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)(permissions_1.PERMISSIONS.MANUFACTURING_WRITE),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ManufacturingController.prototype, "create", null);
exports.ManufacturingController = ManufacturingController = __decorate([
    (0, common_1.Controller)('manufacturing'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [manufacturing_service_1.ManufacturingService])
], ManufacturingController);
//# sourceMappingURL=manufacturing.controller.js.map