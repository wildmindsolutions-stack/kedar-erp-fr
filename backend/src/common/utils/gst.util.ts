export function getFinancialYear(date = new Date()): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  }
  return `${year - 1}-${year.toString().slice(-2)}`;
}

export function isInterState(sellerState: string, buyerState: string): boolean {
  return sellerState.toLowerCase() !== buyerState.toLowerCase();
}

export interface GstLineItem {
  qty: number;
  rate: number;
  gstRate: number;
}

export interface GstCalculation {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  lineTotal: number;
}

export function calculateGstLine(
  item: GstLineItem,
  interState: boolean,
): GstCalculation {
  const taxable = Math.round(item.qty * item.rate * 100) / 100;
  const gstAmount = Math.round(taxable * (item.gstRate / 100) * 100) / 100;
  if (interState) {
    return {
      taxable,
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      lineTotal: Math.round((taxable + gstAmount) * 100) / 100,
    };
  }
  const half = Math.round((gstAmount / 2) * 100) / 100;
  return {
    taxable,
    cgst: half,
    sgst: half,
    igst: 0,
    lineTotal: Math.round((taxable + gstAmount) * 100) / 100,
  };
}

export async function getAllProductStock(
  prisma: { stockLedger: { groupBy: (args: object) => Promise<{ productId: string; _sum: { qtyChange: unknown } }[]> } },
): Promise<Map<string, number>> {
  const rows = await prisma.stockLedger.groupBy({
    by: ['productId'],
    _sum: { qtyChange: true },
  });
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.productId, Number(row._sum.qtyChange ?? 0));
  }
  return map;
}

export async function getCustomerOutstanding(
  prisma: { customerLedger: { findMany: (args: object) => Promise<{ type: string; amount: { toNumber: () => number } }[]> } },
  customerId: string,
): Promise<number> {
  const entries = await prisma.customerLedger.findMany({ where: { customerId } });
  const raw = entries.reduce((sum, e) => {
    const amt = Number(e.amount);
    return e.type === 'DEBIT' ? sum + amt : sum - amt;
  }, 0);
  return Math.round(raw * 100) / 100;
}

/** Sum of amounts customers owe (ignores credit/overpayment balances). */
export async function getTotalOutstandingReceivable(
  prisma: {
    $queryRaw: <T>(query: TemplateStringsArray, ...values: unknown[]) => Promise<T>;
  },
): Promise<number> {
  const rows = await prisma.$queryRaw<{ total: number | string }[]>`
    SELECT COALESCE(SUM(sub.balance), 0) AS total
    FROM (
      SELECT SUM(
        CASE WHEN cl.type = 'DEBIT' THEN cl.amount ELSE -cl.amount END
      ) AS balance
      FROM customer_ledger cl
      INNER JOIN customers c ON c.id = cl.customer_id
      WHERE c.is_deleted = false AND c.is_active = true
      GROUP BY cl.customer_id
      HAVING SUM(
        CASE WHEN cl.type = 'DEBIT' THEN cl.amount ELSE -cl.amount END
      ) > 0
    ) sub
  `;

  return Math.round(Number(rows[0]?.total ?? 0) * 100) / 100;
}

export async function getProductStock(
  prisma: { stockLedger: { findMany: (args: object) => Promise<{ qtyChange: { toNumber: () => number } }[]> } },
  productId: string,
): Promise<number> {
  const entries = await prisma.stockLedger.findMany({ where: { productId } });
  return entries.reduce((sum, e) => sum + Number(e.qtyChange), 0);
}
