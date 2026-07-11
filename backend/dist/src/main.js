"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
    const origins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);
    app.enableCors({
        origin: origins.length === 1 ? origins[0] : origins,
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    app.setGlobalPrefix('api');
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Kedar ERP API running on http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map