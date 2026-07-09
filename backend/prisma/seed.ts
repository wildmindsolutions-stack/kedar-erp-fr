import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ROLES = [
  { name: 'Owner', permissions: ['*'] },
  { name: 'Admin', permissions: ['*'] },
  {
    name: 'Manager',
    permissions: [
      'dashboard:read', 'manufacturing:read', 'manufacturing:write',
      'inventory:read', 'inventory:write', 'sales:read', 'sales:write',
      'customers:read', 'customers:write', 'payments:read', 'payments:write',
      'delivery:read', 'delivery:write', 'products:read', 'products:write',
    ],
  },
  {
    name: 'Accountant',
    permissions: [
      'dashboard:read', 'sales:read', 'sales:write',
      'customers:read', 'customers:write', 'payments:read', 'payments:write', 'products:read',
    ],
  },
  {
    name: 'Warehouse',
    permissions: [
      'dashboard:read',
      'manufacturing:read', 'manufacturing:write',
      'inventory:read', 'inventory:write',
      'delivery:read', 'delivery:write', 'products:read',
    ],
  },
  {
    name: 'Sales',
    permissions: [
      'dashboard:read',
      'sales:read', 'sales:write', 'customers:read', 'customers:write', 'products:read',
    ],
  },
];

const DEMO_USERS = [
  { name: 'Admin User', email: 'admin@kedarenterprise.com', role: 'Owner' },
  { name: 'Rajesh Manager', email: 'manager@kedarenterprise.com', role: 'Manager' },
  { name: 'Priya Accountant', email: 'accountant@kedarenterprise.com', role: 'Accountant' },
  { name: 'Suresh Warehouse', email: 'warehouse@kedarenterprise.com', role: 'Warehouse' },
  { name: 'Amit Sales', email: 'sales@kedarenterprise.com', role: 'Sales' },
];

const CATEGORIES = [
  'Grains', 'Pulses', 'Flour', 'Snacks', 'Spices', 'Other Agricultural Products',
];

const UNITS = [
  { name: 'Kilogram', symbol: 'kg' },
  { name: 'Quintal', symbol: 'qtl' },
  { name: 'Bag', symbol: 'bag' },
  { name: 'Packet', symbol: 'pkt' },
];

const PRODUCTS = [
  { name: 'Wheat', category: 'Grains', unit: 'Quintal', price: 2200, hsn: '1001', gst: 0 },
  { name: 'Bajra', category: 'Grains', unit: 'Quintal', price: 1800, hsn: '1008', gst: 0 },
  { name: 'Chana', category: 'Pulses', unit: 'Quintal', price: 5500, hsn: '0713', gst: 0 },
  { name: 'Moong', category: 'Pulses', unit: 'Quintal', price: 8500, hsn: '0713', gst: 0 },
  { name: 'Toor Dal', category: 'Pulses', unit: 'Quintal', price: 12000, hsn: '0713', gst: 0 },
  { name: 'Wheat Flour', category: 'Flour', unit: 'Bag', price: 450, hsn: '1101', gst: 5 },
  { name: 'Potato Wafers', category: 'Snacks', unit: 'Packet', price: 20, hsn: '1905', gst: 12 },
  { name: 'Potato Chips', category: 'Snacks', unit: 'Packet', price: 25, hsn: '1905', gst: 12 },
  { name: 'Mustard', category: 'Spices', unit: 'Kilogram', price: 120, hsn: '1207', gst: 5 },
  { name: 'Cumin', category: 'Spices', unit: 'Kilogram', price: 450, hsn: '0909', gst: 5 },
];

async function main() {
  console.log('Seeding Kedar ERP database...');

  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: { name: role.name, permissions: role.permissions },
    });
  }

  const passwordHash = await bcrypt.hash('admin123', 10);
  for (const u of DEMO_USERS) {
    const role = await prisma.role.findUnique({ where: { name: u.role } });
    await prisma.user.upsert({
      where: { email: u.email },
      update: { roleId: role!.id },
      create: { name: u.name, email: u.email, passwordHash, roleId: role!.id },
    });
  }

  for (const cat of CATEGORIES) {
    await prisma.productCategory.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }

  for (const unit of UNITS) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: {},
      create: unit,
    });
  }

  const categories = await prisma.productCategory.findMany();
  const units = await prisma.unit.findMany();
  const catMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));
  const unitMap = Object.fromEntries(units.map((u) => [u.name, u.id]));

  for (const p of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({
        data: {
          name: p.name,
          categoryId: catMap[p.category],
          unitId: unitMap[p.unit],
          price: p.price,
          hsnCode: p.hsn,
          gstRate: p.gst,
        },
      });
    }
  }

  const fy = new Date().getMonth() >= 3
    ? `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`
    : `${new Date().getFullYear() - 1}-${new Date().getFullYear().toString().slice(-2)}`;

  await prisma.invoiceSequence.upsert({
    where: { financialYear: fy },
    update: {},
    create: { financialYear: fy, lastNumber: 0 },
  });

  const sampleCustomers = [
    { name: 'Sharma Wholesale', phone: '9876543210', city: 'Pune', state: 'Maharashtra', creditLimit: 500000 },
    { name: 'Patel Retail Store', phone: '9876543211', city: 'Mumbai', state: 'Maharashtra', creditLimit: 100000 },
    { name: 'Gupta Traders', phone: '9876543212', city: 'Ahmedabad', state: 'Gujarat', creditLimit: 300000 },
  ];

  for (const c of sampleCustomers) {
    const existing = await prisma.customer.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.customer.create({ data: c });
    }
  }

  console.log('Seed completed!');
  console.log('Demo logins (password: admin123 for all):');
  DEMO_USERS.forEach((u) => console.log(`  ${u.role}: ${u.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
