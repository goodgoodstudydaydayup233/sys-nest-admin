import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AppConfigService } from './core/config/config.service';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { BusinessExceptionFilter } from './common/filters/business-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { LogService } from './modules/log/log.service';
import { AuthService } from './modules/auth/auth.service';
import { AuthCacheService } from './modules/auth/auth-cache.service';
import { RateLimiterService } from './common/services/rate-limiter.service';
import { FileLoggerService } from './common/logger/file-logger.service';
import { createAccessLogMiddleware } from './common/middleware/access-log.middleware';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 获取配置
  const configService = app.get(AppConfigService);
  const reflector = app.get(Reflector);
  const logService = app.get(LogService);
  const authCacheService = app.get(AuthCacheService);
  const authService = app.get(AuthService);
  const rateLimiterService = app.get(RateLimiterService);
  const fileLogger = app.get(FileLoggerService);

  // 文件日志：接管 Nest 框架日志（启动过程、模块初始化、警告与异常都会写入 app 分类）
  app.useLogger(fileLogger);

  // 全局访问日志中间件（注册在所有守卫之前，401/403/404 等请求也会被完整记录）
  app.use(createAccessLogMiddleware(fileLogger));

  // 进程级异常兜底：未捕获异常/未处理 Promise 拒绝写入 error 分类，避免日志丢失
  process.on('uncaughtException', (err) => {
    fileLogger.error('uncaughtException', err.stack, 'Process');
  });
  process.on('unhandledRejection', (reason) => {
    fileLogger.error(
      'unhandledRejection',
      reason instanceof Error ? reason.stack : String(reason),
      'Process',
    );
  });

  // 全局过滤器
  app.useGlobalFilters(new HttpExceptionFilter(fileLogger), new BusinessExceptionFilter());

  // 全局拦截器（执行顺序：从上到下，限流需在最前面）
  app.useGlobalInterceptors(
    new RateLimitInterceptor(rateLimiterService, configService, reflector),
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
    new PermissionGuard(reflector, configService, authCacheService, authService),
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
    .setTitle('sys-nest-admin API')
    .setDescription('sys-nest-admin 后台管理系统接口文档')
    .setVersion('1.0')
    .addServer(swaggerServerUrl)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // 将 document.paths 中的环境前缀移除，确保接口路径仅展示模块级路径
  const prefixPattern = new RegExp(`^/${apiPrefix}`);
  document.paths = Object.fromEntries(
    Object.entries(document.paths).map(([path, value]) => [path.replace(prefixPattern, '') || '/', value]),
  );

  SwaggerModule.setup('api', app, document);

  // 启动服务
  await app.listen(configService.server.port);
  const port = configService.server.port;
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API prefix: /${apiPrefix}`);
  console.log(`Swagger API docs: http://localhost:${port}/api`);
  console.log(`Swagger JSON (for Apifox import): http://localhost:${port}/api-json`);
}
bootstrap();
