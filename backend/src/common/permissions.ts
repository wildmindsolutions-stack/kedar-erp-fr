export const PERMISSIONS = {
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
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const MODULE_PERMISSIONS: Record<string, Permission[]> = {
  dashboard: [PERMISSIONS.DASHBOARD_READ],
  manufacturing: [PERMISSIONS.MANUFACTURING_READ, PERMISSIONS.MANUFACTURING_WRITE],
  inventory: [PERMISSIONS.INVENTORY_READ, PERMISSIONS.INVENTORY_WRITE],
  sales: [PERMISSIONS.SALES_READ, PERMISSIONS.SALES_WRITE],
  customers: [PERMISSIONS.CUSTOMERS_READ, PERMISSIONS.CUSTOMERS_WRITE],
  payments: [PERMISSIONS.PAYMENTS_READ, PERMISSIONS.PAYMENTS_WRITE],
  delivery: [PERMISSIONS.DELIVERY_READ, PERMISSIONS.DELIVERY_WRITE],
  products: [PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE],
  users: [PERMISSIONS.USERS_READ, PERMISSIONS.USERS_WRITE],
};

export const ROLE_PERMISSIONS: Record<string, Permission[] | ['*']> = {
  Owner: ['*'],
  Admin: ['*'],
  Manager: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.MANUFACTURING_READ,
    PERMISSIONS.MANUFACTURING_WRITE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_WRITE,
    PERMISSIONS.DELIVERY_READ,
    PERMISSIONS.DELIVERY_WRITE,
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
  ],
  Accountant: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.PAYMENTS_READ,
    PERMISSIONS.PAYMENTS_WRITE,
    PERMISSIONS.PRODUCTS_READ,
  ],
  Warehouse: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.MANUFACTURING_READ,
    PERMISSIONS.MANUFACTURING_WRITE,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.INVENTORY_WRITE,
    PERMISSIONS.DELIVERY_READ,
    PERMISSIONS.DELIVERY_WRITE,
    PERMISSIONS.PRODUCTS_READ,
  ],
  Sales: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SALES_READ,
    PERMISSIONS.SALES_WRITE,
    PERMISSIONS.CUSTOMERS_READ,
    PERMISSIONS.CUSTOMERS_WRITE,
    PERMISSIONS.PRODUCTS_READ,
  ],
};

export function hasPermission(userPermissions: string[], role: string, required: Permission): boolean {
  if (role === 'Owner' || role === 'Admin') return true;
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(required);
}

export function canAccessModule(role: string, permissions: string[], module: string): boolean {
  if (role === 'Owner' || role === 'Admin') return true;
  if (permissions.includes('*')) return true;
  const modulePerms = MODULE_PERMISSIONS[module];
  if (!modulePerms) return false;
  return modulePerms.some((p) => permissions.includes(p));
}

export function getRolePermissions(roleName: string): Permission[] {
  const perms = ROLE_PERMISSIONS[roleName];
  if (!perms || perms[0] === '*') {
    return Object.values(PERMISSIONS);
  }
  return perms as Permission[];
}

export function canConfirmSalesOrders(role: string): boolean {
  return ['Owner', 'Admin', 'Manager', 'Accountant'].includes(role);
}
