"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.MODULE_PERMISSIONS = exports.PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.canAccessModule = canAccessModule;
exports.getRolePermissions = getRolePermissions;
exports.canConfirmSalesOrders = canConfirmSalesOrders;
exports.PERMISSIONS = {
    DASHBOARD_READ: 'dashboard:read',
    MANUFACTURING_READ: 'manufacturing:read',
    MANUFACTURING_WRITE: 'manufacturing:write',
    INVENTORY_READ: 'inventory:read',
    INVENTORY_WRITE: 'inventory:write',
    SALES_READ: 'sales:read',
    SALES_WRITE: 'sales:write',
    CUSTOMERS_READ: 'customers:read',
    CUSTOMERS_WRITE: 'customers:write',
    PAYMENTS_READ: 'payments:read',
    PAYMENTS_WRITE: 'payments:write',
    DELIVERY_READ: 'delivery:read',
    DELIVERY_WRITE: 'delivery:write',
    PRODUCTS_READ: 'products:read',
    PRODUCTS_WRITE: 'products:write',
    USERS_READ: 'users:read',
    USERS_WRITE: 'users:write',
};
exports.MODULE_PERMISSIONS = {
    dashboard: [exports.PERMISSIONS.DASHBOARD_READ],
    manufacturing: [exports.PERMISSIONS.MANUFACTURING_READ, exports.PERMISSIONS.MANUFACTURING_WRITE],
    inventory: [exports.PERMISSIONS.INVENTORY_READ, exports.PERMISSIONS.INVENTORY_WRITE],
    sales: [exports.PERMISSIONS.SALES_READ, exports.PERMISSIONS.SALES_WRITE],
    customers: [exports.PERMISSIONS.CUSTOMERS_READ, exports.PERMISSIONS.CUSTOMERS_WRITE],
    payments: [exports.PERMISSIONS.PAYMENTS_READ, exports.PERMISSIONS.PAYMENTS_WRITE],
    delivery: [exports.PERMISSIONS.DELIVERY_READ, exports.PERMISSIONS.DELIVERY_WRITE],
    products: [exports.PERMISSIONS.PRODUCTS_READ, exports.PERMISSIONS.PRODUCTS_WRITE],
    users: [exports.PERMISSIONS.USERS_READ, exports.PERMISSIONS.USERS_WRITE],
};
exports.ROLE_PERMISSIONS = {
    Owner: ['*'],
    Admin: ['*'],
    Manager: [
        exports.PERMISSIONS.DASHBOARD_READ,
        exports.PERMISSIONS.MANUFACTURING_READ,
        exports.PERMISSIONS.MANUFACTURING_WRITE,
        exports.PERMISSIONS.INVENTORY_READ,
        exports.PERMISSIONS.INVENTORY_WRITE,
        exports.PERMISSIONS.SALES_READ,
        exports.PERMISSIONS.SALES_WRITE,
        exports.PERMISSIONS.CUSTOMERS_READ,
        exports.PERMISSIONS.CUSTOMERS_WRITE,
        exports.PERMISSIONS.PAYMENTS_READ,
        exports.PERMISSIONS.PAYMENTS_WRITE,
        exports.PERMISSIONS.DELIVERY_READ,
        exports.PERMISSIONS.DELIVERY_WRITE,
        exports.PERMISSIONS.PRODUCTS_READ,
        exports.PERMISSIONS.PRODUCTS_WRITE,
    ],
    Accountant: [
        exports.PERMISSIONS.DASHBOARD_READ,
        exports.PERMISSIONS.SALES_READ,
        exports.PERMISSIONS.SALES_WRITE,
        exports.PERMISSIONS.CUSTOMERS_READ,
        exports.PERMISSIONS.CUSTOMERS_WRITE,
        exports.PERMISSIONS.PAYMENTS_READ,
        exports.PERMISSIONS.PAYMENTS_WRITE,
        exports.PERMISSIONS.PRODUCTS_READ,
    ],
    Warehouse: [
        exports.PERMISSIONS.DASHBOARD_READ,
        exports.PERMISSIONS.MANUFACTURING_READ,
        exports.PERMISSIONS.MANUFACTURING_WRITE,
        exports.PERMISSIONS.INVENTORY_READ,
        exports.PERMISSIONS.INVENTORY_WRITE,
        exports.PERMISSIONS.DELIVERY_READ,
        exports.PERMISSIONS.DELIVERY_WRITE,
        exports.PERMISSIONS.PRODUCTS_READ,
    ],
    Sales: [
        exports.PERMISSIONS.DASHBOARD_READ,
        exports.PERMISSIONS.SALES_READ,
        exports.PERMISSIONS.SALES_WRITE,
        exports.PERMISSIONS.CUSTOMERS_READ,
        exports.PERMISSIONS.CUSTOMERS_WRITE,
        exports.PERMISSIONS.PRODUCTS_READ,
    ],
};
function hasPermission(userPermissions, role, required) {
    if (role === 'Owner' || role === 'Admin')
        return true;
    if (userPermissions.includes('*'))
        return true;
    return userPermissions.includes(required);
}
function canAccessModule(role, permissions, module) {
    if (role === 'Owner' || role === 'Admin')
        return true;
    if (permissions.includes('*'))
        return true;
    const modulePerms = exports.MODULE_PERMISSIONS[module];
    if (!modulePerms)
        return false;
    return modulePerms.some((p) => permissions.includes(p));
}
function getRolePermissions(roleName) {
    const perms = exports.ROLE_PERMISSIONS[roleName];
    if (!perms || perms[0] === '*') {
        return Object.values(exports.PERMISSIONS);
    }
    return perms;
}
function canConfirmSalesOrders(role) {
    return ['Owner', 'Admin', 'Manager', 'Accountant'].includes(role);
}
//# sourceMappingURL=permissions.js.map