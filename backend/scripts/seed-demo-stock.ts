/**
 * Seeds demo stock via production batches for UAT testing.
 * Run: npx ts-node scripts/seed-demo-stock.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const STOCK_ENTRIES = [
  { productName: 'Wheat', batchNo: 'DEMO-WHT-001', qty: 500 },
  { productName: 'Wheat Flour', batchNo: 'DEMO-FLR-001', qty: 200 },
  { productName: 'Potato Wafers', batchNo: 'DEMO-PW-001', qty: 1000 },
  { productName: 'Chana', batchNo: 'DEMO-CHN-001', qty: 150 },
  { productName: 'Toor Dal', batchNo: 'DEMO-TD-001', qty: 100 },
];

async function main() {
  console.log('Seeding demo stock for testing...');
  const today = new Date();

  for (const entry of STOCK_ENTRIES) {
    const product = await prisma.product.findFirst({ where: { name: entry.productName } });
    if (!product) {
      console.warn(`  Skip: ${entry.productName} not found`);
      continue;
    }

    const existing = await prisma.productionBatch.findFirst({ where: { batchNo: entry.batchNo } });
    if (existing) {
      console.log(`  Already exists: ${entry.batchNo}`);
      continue;
    }

    const batch = await prisma.productionBatch.create({
      data: {
        productId: product.id,
        batchNo: entry.batchNo,
        batchDate: today,
        qtyProduced: entry.qty,
        notes: 'Demo stock for UAT testing',
      },
    });

    await prisma.stockLedger.create({
      data: {
        productId: product.id,
        qtyChange: entry.qty,
        reason: 'PRODUCTION',
        refId: batch.id,
        notes: `Demo batch ${entry.batchNo}`,
      },
    });

    console.log(`  + ${entry.productName}: ${entry.qty} units`);
  }

  console.log('Demo stock ready.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
