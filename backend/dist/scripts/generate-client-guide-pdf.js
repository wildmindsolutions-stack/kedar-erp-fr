"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const outDir = path.resolve(__dirname, '../../docs');
const outFile = path.join(outDir, 'Kedar_ERP_Client_Role_Guide.pdf');
if (!fs.existsSync(outDir))
    fs.mkdirSync(outDir, { recursive: true });
const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
const stream = fs.createWriteStream(outFile);
doc.pipe(stream);
const primary = '#1e40af';
const accent = '#0f766e';
const muted = '#64748b';
const dark = '#0f172a';
function ensureSpace(needed = 80) {
    if (doc.y > doc.page.height - needed)
        doc.addPage();
}
function coverPage() {
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(28).text('Kedar Enterprise ERP', 50, 120, { width: doc.page.width - 100 });
    doc.fontSize(16).fillColor('#94a3b8').text('Client Role & Workflow Guide', 50, 165);
    doc.moveDown(4);
    doc.fontSize(11).fillColor('#cbd5e1').text('Phase 1 — User Roles, Dashboards & Business Flow', 50, 220);
    doc.text('Prepared for client review and UAT', 50, 240);
    doc.fontSize(9).fillColor('#64748b').text('WildMind Solutions · Confidential', 50, doc.page.height - 60);
    doc.addPage();
    doc.fillColor(dark);
}
function h1(text) {
    ensureSpace(60);
    doc.moveDown(0.4).fontSize(18).fillColor(primary).text(text);
    doc.moveDown(0.2).fillColor(dark);
}
function h2(text) {
    ensureSpace(50);
    doc.moveDown(0.5).fontSize(13).fillColor(primary).text(text);
    doc.moveDown(0.25).fillColor(dark).fontSize(10);
}
function h3(text) {
    ensureSpace(40);
    doc.moveDown(0.35).fontSize(11).fillColor(accent).text(text);
    doc.moveDown(0.15).fillColor(dark).fontSize(10);
}
function para(text) {
    ensureSpace(30);
    doc.text(text, { lineGap: 4, align: 'justify' });
    doc.moveDown(0.2);
}
function bullet(text) {
    ensureSpace(20);
    doc.text(`• ${text}`, { indent: 12, lineGap: 3 });
}
function numbered(text, n) {
    ensureSpace(20);
    doc.text(`${n}. ${text}`, { indent: 8, lineGap: 3 });
}
function table(headers, rows, colWidths) {
    const totalW = doc.page.width - 100;
    const widths = colWidths ?? headers.map(() => totalW / headers.length);
    let y = doc.y;
    if (y > doc.page.height - 100) {
        doc.addPage();
        y = 50;
    }
    doc.fontSize(9).fillColor(primary);
    let x = 50;
    headers.forEach((h, i) => {
        doc.text(h, x, y, { width: widths[i] - 6, continued: false });
        x += widths[i];
    });
    y += 18;
    doc.fillColor(dark);
    rows.forEach((row) => {
        const rowH = row.reduce((max, cell, i) => {
            const h = doc.heightOfString(cell, { width: widths[i] - 6, lineGap: 2 });
            return Math.max(max, h);
        }, 14);
        if (y + rowH > doc.page.height - 60) {
            doc.addPage();
            y = 50;
        }
        x = 50;
        row.forEach((cell, i) => {
            doc.text(cell, x, y, { width: widths[i] - 6, lineGap: 2 });
            x += widths[i];
        });
        y += rowH + 6;
    });
    doc.y = y + 6;
    doc.fontSize(10);
}
const DEMO_PASSWORD = 'admin123';
const ROLES = [
    {
        role: 'Owner',
        name: 'Admin User',
        email: 'admin@kedarenterprise.com',
        purpose: 'Full business control — all operations plus user and role administration.',
        sidebar: 'Dashboard · Manufacturing · Inventory · Delivery · Sales & Billing · Customers · Payments · Products · Users & Roles',
        dashboard: [
            'Welcome banner with your name and full business overview subtitle.',
            'My Tasks — challans pending, draft orders, low stock, outstanding collections (clickable cards).',
            'KPI tiles: Today\'s Production, Today\'s Sales, Monthly Revenue, Outstanding, Low Stock, Deliveries.',
            'Invoices ready for challan list and draft sales orders (when applicable).',
            '7-day sales trend chart and best-selling products chart.',
            'Low stock alerts panel and recent activity feed.',
            'Quick Actions — shortcuts to every module you can access.',
        ],
        tasks: [
            'Record production and manage inventory adjustments.',
            'Create, confirm, and invoice sales orders; download GST invoice PDFs.',
            'Manage customers, record payments, and track outstanding balances.',
            'Create delivery challans, dispatch, and mark deliveries complete.',
            'Add/edit products and manage the product catalogue.',
            'Add users, assign roles, activate/deactivate users, reset passwords.',
            'View and manage notifications from the bell icon.',
        ],
        cannot: ['Nothing is restricted — full system access.'],
        dailyFlow: [
            'Review dashboard KPIs and My Tasks each morning.',
            'Handle any pending confirmations, collections, or user requests.',
            'Monitor monthly revenue, outstanding dues, and operational alerts.',
        ],
    },
    {
        role: 'Manager',
        name: 'Rajesh Manager',
        email: 'manager@kedarenterprise.com',
        purpose: 'Run day-to-day operations across production, inventory, sales, billing, payments, and delivery — without user administration.',
        sidebar: 'Dashboard · Manufacturing · Inventory · Delivery · Sales & Billing · Customers · Payments · Products',
        dashboard: [
            'Full operational overview — same KPIs as Owner (except user admin).',
            'My Tasks: create challan, dispatch pending, confirm draft orders, low stock, collections.',
            'Sales trend chart, best sellers, draft orders, invoices awaiting challan.',
            'Low stock alerts and recent activity across modules.',
            'Quick Actions for all operational modules.',
        ],
        tasks: [
            'Record production entries and stock adjustments.',
            'Create and confirm sales orders; generate GST invoices.',
            'Manage customers and record customer payments.',
            'Handle full delivery cycle: challan → dispatch → delivered.',
            'Add and edit products in the catalogue.',
        ],
        cannot: ['Users & Roles module (no access to add or manage users).'],
        dailyFlow: [
            'Check dashboard for pending tasks and draft orders.',
            'Confirm sales orders if Accountant is unavailable.',
            'Monitor low stock and coordinate with Warehouse on production.',
            'Review monthly revenue and outstanding collections.',
        ],
    },
    {
        role: 'Accountant',
        name: 'Priya Accountant',
        email: 'accountant@kedarenterprise.com',
        purpose: 'Commercial operations — sales confirmation, GST invoicing, customer ledgers, and payment collection.',
        sidebar: 'Dashboard · Sales & Billing · Customers · Payments · Products (view only)',
        dashboard: [
            'Subtitle: "Orders to confirm, invoices, and collections".',
            'My Tasks: Confirm draft orders (high priority), outstanding collections.',
            'KPI tiles: Today\'s Sales, Monthly Revenue, Draft Orders count, Outstanding balance.',
            'Draft Sales Orders list — click to go to Sales & Billing for confirmation.',
            'Recent activity for sales, payments, and customers.',
            'Quick Actions: confirm orders, record payments, add customers.',
        ],
        tasks: [
            'Confirm DRAFT sales orders and generate GST invoices (stock deducted automatically).',
            'Download invoice PDFs for records and customer sharing.',
            'Add and edit customers; manage credit limits.',
            'Record payments (Cash, UPI, Bank Transfer, Cheque) against customer balances.',
            'View product catalogue (read-only) when creating or reviewing orders.',
        ],
        cannot: [
            'Manufacturing, Inventory, and Delivery — no access.',
            'Users & Roles — no access.',
            'Cannot create production entries or dispatch goods.',
        ],
        dailyFlow: [
            'Log in → check dashboard for draft orders awaiting confirmation.',
            'Go to Sales & Billing → Confirm & Invoice on each DRAFT order.',
            'If credit limit error appears, adjust order or update customer credit limit.',
            'Record customer payments in Payments module.',
            'Download invoice PDFs; Warehouse is notified to create delivery challan.',
        ],
    },
    {
        role: 'Warehouse',
        name: 'Suresh Warehouse',
        email: 'warehouse@kedarenterprise.com',
        purpose: 'Production, stock control, and physical dispatch of goods.',
        sidebar: 'Dashboard · Manufacturing · Inventory · Delivery · Products (view only)',
        dashboard: [
            'Dedicated Warehouse layout — "Your dispatch queue, stock alerts, and production tasks".',
            'Four KPI tiles: Today\'s Production, Low Stock, Awaiting Challan, To Dispatch.',
            'Dispatch actions panel — task cards for challan, dispatch, and delivery completion.',
            'Invoices ready for challan list with customer name and amount.',
            'Low stock alerts and recent production/delivery activity.',
            'Quick Actions: Production Entry, Stock Check, Create Challan.',
        ],
        tasks: [
            'Create production entries (product, batch no, date, qty) — stock increases automatically.',
            'View stock levels; perform stock adjustments (damage, recounts, corrections).',
            'Create delivery challan from confirmed invoice (vehicle & driver details).',
            'Dispatch challan when vehicle leaves; mark delivered when goods reach customer.',
            'View products (read-only) for production reference.',
        ],
        cannot: [
            'Sales & Billing — cannot create or confirm orders.',
            'Customers and Payments — no access.',
            'Users & Roles — no access.',
        ],
        dailyFlow: [
            'Morning: record production entries in Manufacturing.',
            'Check Inventory for low-stock items.',
            'When Accountant confirms orders → dashboard shows invoices awaiting challan.',
            'Delivery → New Challan → select invoice → Dispatch → Mark Delivered.',
        ],
    },
    {
        role: 'Sales',
        name: 'Amit Sales',
        email: 'sales@kedarenterprise.com',
        purpose: 'Customer-facing sales — create orders and manage customer master data.',
        sidebar: 'Dashboard · Sales & Billing · Customers · Products (view only)',
        dashboard: [
            'Subtitle: "Your orders, customers, and sales pipeline".',
            'My Tasks: draft orders awaiting accountant confirmation.',
            'KPI tile: Draft Orders count (when drafts exist).',
            'Draft Sales Orders list with customer, date, and amount.',
            'Recent activity for sales and customers.',
            'Quick Actions: New Sales Order, Add Customer.',
        ],
        tasks: [
            'Add new customers (name, phone, city, state, credit limit).',
            'Edit customer details (phone is locked after creation).',
            'Create new sales orders with line items — saved as DRAFT.',
            'Track order status; download invoice PDF once Accountant confirms.',
            'Browse product catalogue (read-only) for order line items.',
        ],
        cannot: [
            'Confirm & Invoice — button hidden; only Accountant/Manager can confirm.',
            'Payments, Manufacturing, Inventory, Delivery — no access.',
            'Users & Roles and product add/edit — no access.',
        ],
        dailyFlow: [
            'Add or find customer in Customers module.',
            'Create sales order with products and quantities (status: DRAFT).',
            'Inform Accountant that order is ready for confirmation.',
            'Track status on dashboard; download PDF after invoice is generated.',
        ],
    },
];
coverPage();
h1('1. Introduction');
para('Kedar Enterprise ERP is a web-based system for managing manufacturing, inventory, sales, GST billing, payments, and delivery. Each user logs in with a role that controls which screens and actions they can access. This guide explains login credentials, what each role sees on the dashboard, daily responsibilities, and the end-to-end business flow.');
para(`Default password for all demo accounts: ${DEMO_PASSWORD}`);
h1('2. Login Credentials');
table(['Role', 'Name', 'Email', 'Password'], ROLES.map((r) => [r.role, r.name, r.email, DEMO_PASSWORD]), [80, 110, 200, 80]);
h1('3. Module Access Summary');
table(['Module', 'Owner', 'Manager', 'Accountant', 'Warehouse', 'Sales'], [
    ['Dashboard', 'Full', 'Full', 'Sales focus', 'Warehouse layout', 'Sales focus'],
    ['Manufacturing', 'Read & Write', 'Read & Write', '—', 'Read & Write', '—'],
    ['Inventory', 'Read & Write', 'Read & Write', '—', 'Read & Write', '—'],
    ['Delivery', 'Read & Write', 'Read & Write', '—', 'Read & Write', '—'],
    ['Sales & Billing', 'Read & Write', 'Read & Write', 'Read & Write', '—', 'Read & Write*'],
    ['Customers', 'Read & Write', 'Read & Write', 'Read & Write', '—', 'Read & Write'],
    ['Payments', 'Read & Write', 'Read & Write', 'Read & Write', '—', '—'],
    ['Products', 'Read & Write', 'Read & Write', 'View only', 'View only', 'View only'],
    ['Users & Roles', 'Read & Write', '—', '—', '—', '—'],
], [110, 55, 55, 70, 70, 55]);
para('* Sales can create orders but cannot confirm them or generate invoices.');
doc.addPage();
h1('4. End-to-End Business Flow');
para('A typical order moves through the system in this sequence:');
doc.moveDown(0.3);
numbered('Warehouse records production → stock increases in Inventory.', 1);
numbered('Sales creates a DRAFT sales order for a customer.', 2);
numbered('Accountant (or Manager/Owner) confirms the order → GST invoice is generated and stock is deducted.', 3);
numbered('Warehouse creates delivery challan → dispatches → marks delivered.', 4);
numbered('Accountant records customer payment against outstanding balance.', 5);
numbered('Manager / Owner reviews dashboard, KPIs, and notifications.', 6);
doc.moveDown(0.5);
table(['Step', 'Who', 'What happens'], [
    ['1', 'Warehouse', 'Production entry logged; stock updated'],
    ['2', 'Sales', 'Draft order created with customer & products'],
    ['3', 'Accountant', 'Order confirmed; invoice & PDF generated'],
    ['4', 'Warehouse', 'Challan created → dispatched → delivered'],
    ['5', 'Accountant', 'Payment recorded; balance reduced'],
    ['6', 'Manager / Owner', 'Review reports, tasks, and alerts'],
], [40, 90, 330]);
h2('Important system rules');
bullet('Only Owner, Manager, and Accountant can confirm orders and generate invoices.');
bullet('Sales team creates draft orders only — confirmation is done by Accountant.');
bullet('Customer phone number cannot be changed after the customer is created.');
bullet('System blocks order confirmation if it exceeds the customer\'s credit limit.');
bullet('Non-Owner roles (except Admin) auto-logout after 30 minutes of inactivity.');
for (const r of ROLES) {
    doc.addPage();
    h1(`${r.role} — ${r.name}`);
    h2('Login');
    para(`Email: ${r.email}`);
    para(`Password: ${DEMO_PASSWORD}`);
    h2('Purpose');
    para(r.purpose);
    h2('Modules in sidebar');
    para(r.sidebar);
    h2('Dashboard — what you see & do');
    r.dashboard.forEach((d) => bullet(d));
    h2('What you can do');
    r.tasks.forEach((t) => bullet(t));
    h2('What you cannot do');
    r.cannot.forEach((c) => bullet(c));
    h2('Typical daily workflow');
    r.dailyFlow.forEach((f, i) => numbered(f, i + 1));
}
doc.addPage();
h1('5. Quick Reference — Actions by Screen');
const screens = [
    {
        name: 'Dashboard',
        actions: 'View KPIs, My Tasks, charts, alerts (content filtered by role)',
        roles: 'All roles',
    },
    {
        name: 'Manufacturing',
        actions: 'View batches · New Production Entry',
        roles: 'Owner, Manager, Warehouse',
    },
    {
        name: 'Inventory',
        actions: 'View stock · Stock Adjustment',
        roles: 'Owner, Manager, Warehouse',
    },
    {
        name: 'Delivery',
        actions: 'View challans · New Challan · Dispatch · Mark Delivered',
        roles: 'Owner, Manager, Warehouse',
    },
    {
        name: 'Sales & Billing',
        actions: 'View orders/invoices · New Order · Confirm & Invoice · Download PDF',
        roles: 'Owner, Manager, Accountant, Sales (no confirm for Sales)',
    },
    {
        name: 'Customers',
        actions: 'View · Add · Edit customer',
        roles: 'Owner, Manager, Accountant, Sales',
    },
    {
        name: 'Payments',
        actions: 'View history · Outstanding · Record Payment',
        roles: 'Owner, Manager, Accountant',
    },
    {
        name: 'Products',
        actions: 'View catalogue · Add/Edit product',
        roles: 'View: all with access · Add/Edit: Owner, Manager',
    },
    {
        name: 'Users & Roles',
        actions: 'View users · Add user · Manage roles',
        roles: 'Owner only',
    },
];
table(['Screen', 'Main actions', 'Who can access'], screens.map((s) => [s.name, s.actions, s.roles]), [95, 250, 120]);
doc.moveDown(1);
h2('Support & next steps');
bullet('Use the credentials above to log in and walk through each role.');
bullet('Follow Section 4 business flow to test a complete order lifecycle.');
bullet('Contact your implementation team for production URL and live training.');
doc.moveDown(1.5);
doc.fontSize(8).fillColor(muted).text('Kedar Enterprise ERP · Client Role Guide · Phase 1 · WildMind Solutions · Confidential', { align: 'center' });
doc.end();
stream.on('finish', () => {
    console.log(`PDF created: ${outFile}`);
});
//# sourceMappingURL=generate-client-guide-pdf.js.map