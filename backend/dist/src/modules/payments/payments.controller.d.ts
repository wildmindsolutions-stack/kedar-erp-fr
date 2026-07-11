import { PaymentsService } from './payments.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class PaymentsController {
    private paymentsService;
    constructor(paymentsService: PaymentsService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        customer: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            isDeleted: boolean;
            gstin: string | null;
            phone: string | null;
            address: string | null;
            city: string | null;
            state: string;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
        };
        creator: {
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        createdBy: string | null;
        customerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        mode: import(".prisma/client").$Enums.PaymentMode;
        reference: string | null;
        receivedAt: Date;
    })[]>;
    getOutstanding(): Promise<{
        customerId: string;
        customerName: string;
        phone: string | null;
        creditLimit: number;
        outstanding: number;
    }[]>;
    create(body: {
        customerId: string;
        amount: number;
        mode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';
        reference?: string;
        receivedAt: string;
        notes?: string;
    }, user: JwtPayload): Promise<{
        customer: {
            id: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            isDeleted: boolean;
            gstin: string | null;
            phone: string | null;
            address: string | null;
            city: string | null;
            state: string;
            creditLimit: import("@prisma/client/runtime/library").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        notes: string | null;
        createdBy: string | null;
        customerId: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        mode: import(".prisma/client").$Enums.PaymentMode;
        reference: string | null;
        receivedAt: Date;
    }>;
}
