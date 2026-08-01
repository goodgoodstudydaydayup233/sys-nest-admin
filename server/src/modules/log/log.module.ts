import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OperationLog } from './entities/operation-log.entity';
import { LoginLog } from './entities/login-log.entity';
import { LogService } from './log.service';
import { LogRepository } from './log.repository';
import { LogController } from './log.controller';
import { LoginLogService } from './login-log.service';
import { LoginLogRepository } from './login-log.repository';
import { LoginLogController } from './login-log.controller';
import { LoggingInterceptor } from '../../common/interceptors/logging.interceptor';

/**
 * 日志模块
 * @description 对标若依日志能力，包含：
 * 1. 操作日志（sys_oper_log）：通过全局 LoggingInterceptor 拦截 @Log 装饰器标注的接口自动记录
 * 2. 登录日志（sys_logininfor）：由 AuthService 在登录成功/失败时主动调用记录
 */
@Module({
  imports: [TypeOrmModule.forFeature([OperationLog, LoginLog])],
  controllers: [LogController, LoginLogController],
  providers: [
    LogService,
    LogRepository,
    LoginLogService,
    LoginLogRepository,
    LoggingInterceptor,
    // 全局注册操作日志拦截器，依赖 LogService（同模块可注入）
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
  exports: [LogService, LoginLogService],
})
export class LogModule {}
