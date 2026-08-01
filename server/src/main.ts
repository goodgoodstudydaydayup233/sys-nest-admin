import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AppConfigService } from './core/config/config.service';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { LogService } from './modules/log/log.service';
import { AuthCacheService } from './modules/auth/auth-cache.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 获取配置
  const configService = app.get(AppConfigService);
  const reflector = app.get(Reflector);
  const logService = app.get(LogService);
  const authCacheService = app.get(AuthCacheService);

  // 全局过滤器
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new BusinessExceptionFilter(),
  );

  // 全局拦截器
  app.useGlobalInterceptors(
    new LoggingInterceptor(logService, reflector),
    new TransformInterceptor(),
  );

  // 静态资源 - 上传文件访问
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  // 全局路由前缀（开发环境 dev-api，生产环境 prod-api，由配置文件控制）
  const apiPrefix = configService.app.apiPrefix;
  app.setGlobalPrefix(apiPrefix);

  // 配置JwtAuthGuard的白名单服务
  JwtAuthGuard.setConfigService(configService);

  // 全局守卫
  app.useGlobalGuards(
    new JwtAuthGuard(),
    new PermissionGuard(reflector, configService, authCacheService),
  );

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger 文档配置
  // 接口路径中去掉环境前缀，统一在 Servers 中展示完整基础地址
  const swaggerServerUrl = configService.swagger.serverUrl;
  const swaggerConfig = new DocumentBuilder()
    .setTitle('H Admin API')
    .setDescription('H Admin 后台管理系统接口文档')
    .setVersion('1.0')
    .addServer(swaggerServerUrl)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // 将 document.paths 中的环境前缀移除，确保接口路径仅展示模块级路径
  const prefixPattern = new RegExp(`^/${apiPrefix}`);
  document.paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, value]) => [
      path.replace(prefixPattern, '') || '/',
      value,
    ]),
  );

  SwaggerModule.setup('api', app, document);

  // 启动服务
  await app.listen(configService.server.port);
  const port = configService.server.port;
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API prefix: /${apiPrefix}`);
  console.log(`Swagger API docs: http://localhost:${port}/api`);
  console.log(
    `Swagger JSON (for Apifox import): http://localhost:${port}/api-json`,
  );
}
bootstrap();
