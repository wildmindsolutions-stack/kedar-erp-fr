import { UsersService } from './users.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
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
    create(body: {
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
    updateRole(roleId: string, body: {
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
    update(id: string, body: {
        name?: string;
        email?: string;
        roleId?: string;
        isActive?: boolean;
    }, user: JwtPayload): Promise<{
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
    deactivate(id: string, user: JwtPayload): Promise<{
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
    resetPassword(id: string, body: {
        password: string;
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
}
