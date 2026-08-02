import { Module } from '@nestjs/common';
import { AppConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { AppConfigRedisModule } from './core/redis/redis.module';
import { RateLimiterModule } from './common/services/rate-limiter.module';
import { LogModule } from './modules/log/log.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthCacheModule } from './modules/auth/auth-cache.module';
import { UserModule } from './modules/user/user.module';
import { RoleModule } from './modules/role/role.module';
import { MenuModule } from './modules/menu/menu.module';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { ConfigModule } from './modules/config/config.module';
import { DictModule } from './modules/dict/dict.module';
import { JobModule } from './modules/job/job.module';
import { CacheModule } from './modules/cache/cache.module';
import { OnlineModule } from './modules/online/online.module';
import { ServerModule } from './modules/server/server.module';
import { NoticeModule } from './modules/notice/notice.module';
import { FileModule } from './common/services/file.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    AppConfigRedisModule,
    RateLimiterModule,
    FileModule,
    LogModule,
    AuthModule,
    AuthCacheModule,
    UserModule,
    RoleModule,
    MenuModule,
    CaptchaModule,
    ConfigModule,
    DictModule,
    JobModule,
    CacheModule,
    OnlineModule,
    ServerModule,
    NoticeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
