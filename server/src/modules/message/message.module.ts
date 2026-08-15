import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { MessageRepository } from './message.repository';
import { MessageSseService } from './message-sse.service';
import { Message } from './entities/message.entity';
import { User } from '../user/entities/user.entity';
import { AppConfigModule } from '../../core/config/config.module';
import { AppConfigService } from '../../core/config/config.service';

/**
 * 站内信模块
 * @description 提供站内信发送、个人收件箱管理以及 SSE 实时推送能力
 *
 * @注意
 * - 引入 User 实体用于「全员发送」时查询启用用户列表
 * - JwtModule 用于 SSE 端点手动校验 token（EventSource 无法携带 Authorization 头）
 * - AuthCacheService 为 @Global 模块提供，用于 SSE 端点校验 token 黑名单
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Message, User]),
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwt.secret,
        signOptions: { expiresIn: configService.jwt.accessTokenExpiresIn as any },
      }),
    }),
  ],
  controllers: [MessageController],
  providers: [MessageService, MessageRepository, MessageSseService],
  exports: [MessageService, MessageSseService],
})
export class MessageModule {}
