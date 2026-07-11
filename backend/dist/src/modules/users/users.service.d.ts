import { PrismaService } from '../../prisma/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): import(".prisma/client").Prisma.PrismaPromise<({
        role: {
            id: string;
            name: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        roleId: string;
    })[]>;
    findRoles(): import(".prisma/client").Prisma.PrismaPromise<({
        _count: {
            users: number;
        };
    } & {
        id: string;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    create(data: {
        name: string;
        email: string;
        password: string;
        roleId: string;
    }): Promise<{
        role: {
            id: string;
            name: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        roleId: string;
    }>;
    update(actorId: string, id: string, data: {
        name?: string;
        email?: string;
        roleId?: string;
        isActive?: boolean;
    }): Promise<{
        role: {
            id: string;
            name: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        roleId: string;
    }>;
    deactivate(actorId: string, id: string): Promise<{
        role: {
            id: string;
            name: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        roleId: string;
    }>;
    resetPassword(id: string, password: string): Promise<{
        role: {
            id: string;
            name: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        passwordHash: string;
        roleId: string;
    }>;
    updateRole(roleId: string, data: {
        isActive?: boolean;
    }): Promise<{
        _count: {
            users: number;
        };
    } & {
        id: string;
        name: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    removeRole(roleId: string): Promise<{
        success: boolean;
        name: string;
    }>;
    private ensureAnotherActiveOwner;
}
