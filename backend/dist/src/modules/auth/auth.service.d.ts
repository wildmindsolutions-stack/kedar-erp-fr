import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwt;
    constructor(prisma: PrismaService, jwt: JwtService);
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            permissions: import("@prisma/client/runtime/library").JsonValue;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
