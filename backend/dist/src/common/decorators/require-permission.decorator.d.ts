import { Permission } from '../permissions';
export declare const PERMISSIONS_KEY = "permissions";
export declare const RequirePermission: (...permissions: Permission[]) => import("@nestjs/common").CustomDecorator<string>;
