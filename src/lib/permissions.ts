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

export function hasPermission(role: string, permissions: string[], required: Permission): boolean {
  if (role === 'Owner' || role === 'Admin') return true;
  if (permissions.includes('*')) return true;
  return permissions.includes(required);
}

export function canAccessModule(role: string, permissions: string[], module: string): boolean {
  if (role === 'Owner' || role === 'Admin') return true;
  if (permissions.includes('*')) return true;
  const prefix = `${module}:`;
  return permissions.some((p) => p.startsWith(prefix));
}

/** Map URL path to permission module key. */
export function getModuleFromPath(pathname: string): string {
  if (pathname.startsWith('/settings/users')) return 'users';
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment || 'dashboard';
}

/** Whether the current user may open this route (sidebar + direct URL). */
export function canAccessRoute(role: string, permissions: string[], pathname: string): boolean {
  const mod = getModuleFromPath(pathname);
  if (mod === 'users') return role === 'Owner' || role === 'Admin';
  return canAccessModule(role, permissions, mod);
}

export function canWriteModule(role: string, permissions: string[], module: string): boolean {
  if (role === 'Owner' || role === 'Admin') return true;
  return permissions.includes(`${module}:write`);
}

/** Sales creates draft orders; Accountant/Manager confirms and generates invoices. */
export function canConfirmSalesOrders(role: string): boolean {
  return ['Owner', 'Admin', 'Manager', 'Accountant'].includes(role);
}

export const ROLE_HOME: Record<string, string> = {
  Owner: '/dashboard',
  Admin: '/dashboard',
  Manager: '/dashboard',
  Accountant: '/dashboard',
  Warehouse: '/dashboard',
  Sales: '/dashboard',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  Owner: 'Full access to all modules, users, and business reports',
  Admin: 'Full system administration and all operational modules',
  Manager: 'All operations — production, inventory, sales, payments, delivery',
  Accountant: 'Sales, invoicing, payments, and customer ledgers',
  Warehouse: 'Production entry, inventory, and dispatch operations',
  Sales: 'Sales orders, customers, and product catalogue',
};

export const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', module: 'dashboard', icon: 'dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/manufacturing', label: 'Manufacturing', module: 'manufacturing', icon: 'factory' },
      { href: '/inventory', label: 'Inventory', module: 'inventory', icon: 'package' },
      { href: '/delivery', label: 'Delivery', module: 'delivery', icon: 'truck' },
    ],
  },
  {
    label: 'Commercial',
    items: [
      { href: '/sales', label: 'Sales & Billing', module: 'sales', icon: 'cart' },
      { href: '/sales/pre-bookings', label: 'Pre-Bookings', module: 'sales', icon: 'calendar' },
      { href: '/customers', label: 'Customers', module: 'customers', icon: 'users' },
      { href: '/payments', label: 'Payments', module: 'payments', icon: 'credit' },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { href: '/products', label: 'Products', module: 'products', icon: 'box' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/settings/users', label: 'Users & Roles', module: 'users', icon: 'settings' },
    ],
  },
];

export const MODULE_META: Record<string, { title: string; description: string; flowStep?: number }> = {
  dashboard: { title: 'Dashboard', description: 'Live business overview and KPIs' },
  manufacturing: { title: 'Manufacturing', description: 'Daily production entry, batches, and yield tracking', flowStep: 1 },
  inventory: { title: 'Inventory', description: 'Stock levels, adjustments, and low-stock alerts', flowStep: 2 },
  sales: { title: 'Sales & GST Billing', description: 'Sales orders, invoice generation, and sales register', flowStep: 3 },
  'pre-bookings': { title: 'Website Pre-Bookings', description: 'Cash-on-delivery pre-bookings from the Kedar Foundation website' },
  customers: { title: 'Customer Management', description: 'Customer database, credit limits, and ledgers', flowStep: 3 },
  payments: { title: 'Payment Management', description: 'Payment receipts, outstanding tracking, and collections', flowStep: 5 },
  delivery: { title: 'Delivery Management', description: 'Delivery challan, dispatch, and tracking', flowStep: 4 },
  products: { title: 'Product Management', description: 'Product master, categories, HSN codes, and pricing' },
  users: { title: 'User Management', description: 'Users, roles, and permission management' },
};
