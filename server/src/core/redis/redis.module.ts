import { Module, Global } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        type: 'single',
        options: {
          host: configService.redis.host,
          port: configService.redis.port,
          password: configService.redis.password || undefined,
          db: configService.redis.db,
        },
      }),
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class AppConfigRedisModule {}
