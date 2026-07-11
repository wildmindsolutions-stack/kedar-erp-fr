"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const outDir = path.resolve(__dirname, '../../docs');
const outFile = path.join(outDir, 'Kedar_ERP_Testing_Flow.pdf');
if (!fs.existsSync(outDir))
    fs.mkdirSync(outDir, { recursive: true });
const doc = new PDFDocument({ margin: 50, size: 'A4' });
const stream = fs.createWriteStream(outFile);
doc.pipe(stream);
const primary = '#1e40af';
const muted = '#64748b';
function title(text) {
    doc.moveDown(0.5).fontSize(20).fillColor(primary).text(text, { align: 'left' });
    doc.moveDown(0.3).fontSize(10).fillColor(muted).text('Kedar Enterprise ERP — Manual Role Testing Guide', { align: 'left' });
    doc.moveDown(0.8).fillColor('#0f172a');
}
function h2(text) {
    doc.moveDown(0.6).fontSize(13).fillColor(primary).text(text);
    doc.moveDown(0.3).fillColor('#0f172a').fontSize(10);
}
function h3(text) {
    doc.moveDown(0.4).fontSize(11).fillColor('#0f172a').text(text, { underline: true });
    doc.moveDown(0.2).fontSize(10);
}
function bullet(text) {
    doc.text(`• ${text}`, { indent: 10, lineGap: 3 });
}
function para(text) {
    doc.text(text, { lineGap: 4 });
}
function table(headers, rows) {
    const colW = (doc.page.width - 100) / headers.length;
    let y = doc.y;
    doc.fontSize(9).fillColor(primary);
    headers.forEach((h, i) => doc.text(h, 50 + i * colW, y, { width: colW - 4 }));
    y += 16;
    doc.fillColor('#0f172a');
    rows.forEach((row) => {
        if (y > doc.page.height - 80) {
            doc.addPage();
            y = 50;
        }
        row.forEach((cell, i) => doc.text(cell, 50 + i * colW, y, { width: colW - 4, lineGap: 2 }));
        y += 14 * Math.max(1, Math.ceil(row.join(' ').length / 40));
    });
    doc.y = y + 8;
}
title('ERP Testing Flow — All Roles');
para('App URL: http://localhost:3000');
para('Password for all demo accounts: admin123');
doc.moveDown(0.5);
h2('Before You Start');
bullet('Backend: cd backend && npm run start:dev');
bullet('Frontend: cd frontend && npm run dev');
bullet('Seed DB: cd backend && npx prisma db seed');
bullet('Sign out after each role before logging in as the next role.');
doc.moveDown(0.3);
h2('Business Flow Overview');
para('Warehouse → Sales → Accountant → Warehouse → Accountant → Manager → Owner');
doc.moveDown(0.3);
table(['Step', 'Role', 'Email', 'Main Action'], [
    ['1', 'Warehouse', 'warehouse@kedarenterprise.com', 'Production entry + stock check'],
    ['2', 'Sales', 'sales@kedarenterprise.com', 'Create DRAFT sales order'],
    ['3', 'Accountant', 'accountant@kedarenterprise.com', 'Confirm & invoice + payment'],
    ['4', 'Warehouse', 'warehouse@kedarenterprise.com', 'Challan → dispatch → deliver'],
    ['5', 'Manager', 'manager@kedarenterprise.com', 'Review all operations'],
    ['6', 'Owner', 'admin@kedarenterprise.com', 'Users + notifications'],
]);
doc.addPage();
h2('STEP 1 — Warehouse');
para('Login: warehouse@kedarenterprise.com / admin123');
h3('1a. Record Production');
bullet('Manufacturing → New Production Entry');
bullet('Product: Wheat or Wheat Flour | Batch: BATCH-001 | Qty: 50');
bullet('Expect: batch in table, stock increases in Inventory');
h3('1b. Verify Dashboard');
bullet("Today's Production KPI should show units produced (not 0)");
bullet('KPI tiles: Production, Low Stock, Awaiting Challan, To Dispatch');
h3('Must NOT see');
bullet('Sales, Customers, Payments in sidebar');
doc.moveDown(0.3);
h2('STEP 2 — Sales');
para('Login: sales@kedarenterprise.com / admin123');
h3('2a. Create Sales Order');
bullet('Sales & Billing → New Sales Order');
bullet('Customer: Sharma Wholesale | Product: Wheat Flour | Qty: 10');
bullet('Expect: status DRAFT, badge "Awaiting confirmation"');
bullet('Confirm & Invoice button must NOT appear');
h3('Must NOT see');
bullet('Payments, Manufacturing, Inventory, Delivery');
doc.addPage();
h2('STEP 3 — Accountant');
para('Login: accountant@kedarenterprise.com / admin123');
h3('3a. Confirm Order');
bullet('Sales & Billing → Orders → Confirm & Invoice on DRAFT order');
bullet('Expect: GST invoice number, PDF button, stock deducted');
h3('3b. Record Payment');
bullet('Payments → Record Payment | Amount: 500 | Mode: UPI');
h3('Must NOT see');
bullet('Manufacturing, Inventory, Delivery');
h2('STEP 4 — Warehouse (Delivery)');
h3('4a. Create Challan');
bullet('Delivery → New Challan → select invoice | Vehicle + driver');
h3('4b. Dispatch then Mark Delivered');
bullet('Status flow: PENDING → DISPATCHED → DELIVERED');
bullet('Dashboard shows invoice ready for challan before step 4a');
doc.addPage();
h2('STEP 5 — Manager');
para('Login: manager@kedarenterprise.com / admin123');
bullet('Full operational dashboard: production, sales, revenue, payments');
bullet('Can access all modules EXCEPT Users & Roles');
bullet('Verify order, invoice, delivery, payment from previous steps');
h2('STEP 6 — Owner');
para('Login: admin@kedarenterprise.com / admin123');
bullet('Everything Manager has + Users & Roles');
bullet('Bell icon → view/mark notifications');
bullet('Users & Roles → view all users, optionally add test user');
h2('Role Checklist');
table(['Role', 'Must Work', 'Must Be Blocked'], [
    ['Warehouse', 'Production, inventory, delivery', 'Sales, customers, payments'],
    ['Sales', 'Draft orders, customers', 'Confirm invoice, payments, delivery'],
    ['Accountant', 'Confirm, PDF, payments', 'Manufacturing, inventory, delivery'],
    ['Manager', 'All operations', 'Users & Roles'],
    ['Owner', 'Everything', 'Nothing blocked'],
]);
doc.moveDown(0.5);
h2('Automated API Test');
para('powershell -ExecutionPolicy Bypass -File backend\\scripts\\test-role-flows.ps1');
doc.moveDown(1);
doc.fontSize(8).fillColor(muted).text('WildMind Solutions · Kedar Enterprise ERP · Confidential', { align: 'center' });
doc.end();
stream.on('finish', () => {
    console.log(`PDF created: ${outFile}`);
});
//# sourceMappingURL=generate-testing-flow-pdf.js.map