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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const gst_util_1 = require("../../common/utils/gst.util");
const PDFKit = require("pdfkit");
const notifications_service_1 = require("../notifications/notifications.service");
let SalesService = class SalesService {
    constructor(prisma, config, notifications) {
        this.prisma = prisma;
        this.config = config;
        this.notifications = notifications;
    }
    findAll() {
        return this.prisma.salesOrder.findMany({
            include: {
                customer: true,
                items: { include: { product: true } },
                invoice: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    findInvoices() {
        return this.prisma.invoice.findMany({
            where: { isDeleted: false },
            include: {
                order: { include: { customer: true } },
                items: { include: { product: true } },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }
    async createOrder(data) {
        if (!data.items?.length) {
            throw new common_1.BadRequestException('Order must have at least one item');
        }
        const order = await this.prisma.salesOrder.create({
            data: {
                customerId: data.customerId,
                orderDate: new Date(data.orderDate),
                notes: data.notes,
                createdBy: data.createdBy,
                status: 'DRAFT',
                items: {
                    create: data.items.map((i) => ({
                        productId: i.productId,
                        qty: i.qty,
                        rate: i.rate,
                    })),
                },
            },
            include: {
                customer: true,
                items: { include: { product: true } },
            },
        });
        const actor = data.createdBy
            ? await this.prisma.user.findUnique({ where: { id: data.createdBy } })
            : null;
        await this.notifications.notifyByModule({
            module: 'sales',
            type: 'ORDER_CREATED',
            title: 'New Sales Order',
            message: `${actor?.name || 'Sales'} created a draft order for ${order.customer.name}`,
            refId: order.id,
            link: '/sales',
            actorId: data.createdBy,
        });
        return order;
    }
    async confirmOrder(orderId, userId) {
        const sellerState = this.config.get('COMPANY_STATE') || 'Maharashtra';
        const sellerGstin = this.config.get('COMPANY_GSTIN') || '';
        const invoice = await this.prisma.$transaction(async (tx) => {
            const order = await tx.salesOrder.findUnique({
                where: { id: orderId },
                include: {
                    customer: true,
                    items: { include: { product: true } },
                    invoice: true,
                },
            });
            if (!order)
                throw new common_1.NotFoundException('Order not found');
            if (order.status === 'CONFIRMED') {
                throw new common_1.BadRequestException('Order already confirmed');
            }
            if (order.status === 'CANCELLED') {
                throw new common_1.BadRequestException('Cannot confirm cancelled order');
            }
            for (const item of order.items) {
                const stock = await (0, gst_util_1.getProductStock)(tx, item.productId);
                if (stock < Number(item.qty)) {
                    throw new common_1.BadRequestException(`Insufficient stock for ${item.product.name}. Available: ${stock}`);
                }
            }
            const outstanding = await (0, gst_util_1.getCustomerOutstanding)(tx, order.customerId);
            const orderTotal = order.items.reduce((sum, i) => sum + Number(i.qty) * Number(i.rate), 0);
            const creditLimit = Number(order.customer.creditLimit);
            if (creditLimit > 0 && outstanding + orderTotal > creditLimit) {
                const available = Math.max(0, creditLimit - outstanding);
                throw new common_1.BadRequestException(`Customer credit limit exceeded. Credit limit: ₹${creditLimit.toFixed(2)}, outstanding: ₹${outstanding.toFixed(2)}, order total: ₹${orderTotal.toFixed(2)}, available credit: ₹${available.toFixed(2)}.`);
            }
            const interState = (0, gst_util_1.isInterState)(sellerState, order.customer.state);
            const fy = (0, gst_util_1.getFinancialYear)();
            const seq = await tx.$queryRaw `
        SELECT last_number FROM invoice_sequences WHERE financial_year = ${fy} FOR UPDATE
      `;
            let nextNum;
            if (!seq.length) {
                await tx.invoiceSequence.create({ data: { financialYear: fy, lastNumber: 1 } });
                nextNum = 1;
            }
            else {
                nextNum = seq[0].last_number + 1;
                await tx.invoiceSequence.update({
                    where: { financialYear: fy },
                    data: { lastNumber: nextNum },
                });
            }
            const invoiceNo = `KE/${fy}/${String(nextNum).padStart(4, '0')}`;
            let subtotal = 0;
            let cgstTotal = 0;
            let sgstTotal = 0;
            let igstTotal = 0;
            const invoiceItemsData = order.items.map((item) => {
                const gst = (0, gst_util_1.calculateGstLine)({
                    qty: Number(item.qty),
                    rate: Number(item.rate),
                    gstRate: Number(item.product.gstRate),
                }, interState);
                subtotal += gst.taxable;
                cgstTotal += gst.cgst;
                sgstTotal += gst.sgst;
                igstTotal += gst.igst;
                return {
                    productId: item.productId,
                    qty: item.qty,
                    rate: item.rate,
                    hsnCode: item.product.hsnCode,
                    gstRate: item.product.gstRate,
                    taxable: gst.taxable,
                    cgst: gst.cgst,
                    sgst: gst.sgst,
                    igst: gst.igst,
                    lineTotal: gst.lineTotal,
                };
            });
            const gstAmount = cgstTotal + sgstTotal + igstTotal;
            const total = subtotal + gstAmount;
            const invoice = await tx.invoice.create({
                data: {
                    orderId: order.id,
                    invoiceNo,
                    subtotal,
                    cgstAmount: cgstTotal,
                    sgstAmount: sgstTotal,
                    igstAmount: igstTotal,
                    gstAmount,
                    total,
                    sellerGstin,
                    buyerGstin: order.customer.gstin,
                    issuedAt: new Date(),
                    financialYear: fy,
                    items: { create: invoiceItemsData },
                },
                include: { items: { include: { product: true } }, order: { include: { customer: true } } },
            });
            for (const item of order.items) {
                await tx.stockLedger.create({
                    data: {
                        productId: item.productId,
                        qtyChange: -Number(item.qty),
                        reason: 'SALE',
                        refId: invoice.id,
                        createdBy: userId,
                    },
                });
            }
            await tx.customerLedger.create({
                data: {
                    customerId: order.customerId,
                    amount: total,
                    type: 'DEBIT',
                    refId: invoice.id,
                    notes: `Invoice ${invoiceNo}`,
                },
            });
            await tx.salesOrder.update({
                where: { id: orderId },
                data: { status: 'CONFIRMED' },
            });
            await tx.auditLog.create({
                data: {
                    userId,
                    entity: 'sales_order',
                    action: 'confirm',
                    after: { orderId, invoiceNo, total },
                },
            });
            return invoice;
        });
        const actor = await this.prisma.user.findUnique({ where: { id: userId } });
        await this.notifications.notifyByModule({
            module: 'sales',
            type: 'ORDER_CONFIRMED',
            title: 'Invoice Generated',
            message: `${actor?.name || 'User'} confirmed order — Invoice ${invoice.invoiceNo} for ₹${Number(invoice.total)} (${invoice.order.customer.name})`,
            refId: invoice.id,
            link: '/sales',
            actorId: userId,
        });
        await this.notifications.notifyByModule({
            module: 'payments',
            type: 'INVOICE_ISSUED',
            title: 'New Invoice — Payment Due',
            message: `Invoice ${invoice.invoiceNo}: ₹${Number(invoice.total)} due from ${invoice.order.customer.name}`,
            refId: invoice.id,
            link: '/payments',
            actorId: userId,
        });
        await this.notifications.notifyByModule({
            module: 'inventory',
            type: 'STOCK_DEDUCTED',
            title: 'Stock Deducted for Sale',
            message: `Stock reduced for invoice ${invoice.invoiceNo}`,
            refId: invoice.id,
            link: '/inventory',
            actorId: userId,
        });
        await this.notifications.notifyByModule({
            module: 'delivery',
            type: 'READY_FOR_DISPATCH',
            title: 'Invoice Ready for Dispatch',
            message: `Invoice ${invoice.invoiceNo} confirmed for ${invoice.order.customer.name} — create delivery challan`,
            refId: invoice.id,
            link: '/delivery',
            actorId: userId,
        });
        return invoice;
    }
    async cancelOrder(orderId) {
        const order = await this.prisma.salesOrder.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        if (order.status === 'CONFIRMED') {
            throw new common_1.BadRequestException('Cannot cancel confirmed order');
        }
        return this.prisma.salesOrder.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
        });
    }
    async generateInvoicePdf(invoiceId, res) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: {
                items: { include: { product: true } },
                order: { include: { customer: true } },
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        const companyName = this.config.get('COMPANY_NAME') || 'Kedar Enterprise';
        const fmt = (n) => `Rs. ${n.toFixed(2)}`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNo.replace(/\//g, '-')}.pdf"`);
        const doc = new PDFKit({ margin: 50, size: 'A4' });
        doc.pipe(res);
        doc.fontSize(20).text(companyName, { align: 'center' });
        doc.fontSize(10).text('Tax Invoice', { align: 'center' });
        doc.moveDown();
        doc.fontSize(11).text(`Invoice No: ${invoice.invoiceNo}`);
        doc.text(`Date: ${invoice.issuedAt.toLocaleDateString('en-IN')}`);
        doc.text(`Seller GSTIN: ${invoice.sellerGstin}`);
        doc.text(`Buyer: ${invoice.order.customer.name}`);
        if (invoice.buyerGstin)
            doc.text(`Buyer GSTIN: ${invoice.buyerGstin}`);
        doc.moveDown();
        const col = { product: 50, hsn: 200, qty: 270, rate: 320, taxable: 380, total: 460 };
        doc.fontSize(10).font('Helvetica-Bold');
        let rowY = doc.y;
        doc.text('Product', col.product, rowY);
        doc.text('HSN', col.hsn, rowY);
        doc.text('Qty', col.qty, rowY);
        doc.text('Rate', col.rate, rowY);
        doc.text('Taxable', col.taxable, rowY);
        doc.text('Total', col.total, rowY);
        doc.font('Helvetica');
        rowY = doc.y + 14;
        doc.moveTo(50, rowY).lineTo(545, rowY).stroke();
        rowY += 8;
        for (const item of invoice.items) {
            doc.text(item.product.name, col.product, rowY, { width: 140 });
            doc.text(item.hsnCode, col.hsn, rowY);
            doc.text(String(Number(item.qty)), col.qty, rowY);
            doc.text(fmt(Number(item.rate)), col.rate, rowY);
            doc.text(fmt(Number(item.taxable)), col.taxable, rowY);
            doc.text(fmt(Number(item.lineTotal)), col.total, rowY);
            rowY += 20;
        }
        doc.y = rowY + 10;
        doc.text(`Subtotal: ${fmt(Number(invoice.subtotal))}`, { align: 'right' });
        if (Number(invoice.cgstAmount) > 0) {
            doc.text(`CGST: ${fmt(Number(invoice.cgstAmount))}`, { align: 'right' });
            doc.text(`SGST: ${fmt(Number(invoice.sgstAmount))}`, { align: 'right' });
        }
        if (Number(invoice.igstAmount) > 0) {
            doc.text(`IGST: ${fmt(Number(invoice.igstAmount))}`, { align: 'right' });
        }
        doc.fontSize(13).text(`Grand Total: ${fmt(Number(invoice.total))}`, { align: 'right' });
        doc.end();
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], SalesService);
//# sourceMappingURL=sales.service.js.map