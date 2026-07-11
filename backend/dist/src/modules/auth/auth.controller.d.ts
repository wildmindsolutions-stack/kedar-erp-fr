import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    me(user: JwtPayload): Promise<{
        id: string;
        name: string;
        email: string;
        role: string;
        permissions: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
