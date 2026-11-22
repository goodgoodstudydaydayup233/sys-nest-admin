import { Module } from '@nestjs/common';
import { ServerService } from './server.service';
import { ServerController } from './server.controller';

/**
 * 服务监控模块
 * @description 提供服务器 CPU/内存/磁盘/系统/Node.js 运行时监控能力
 */
@Module({
  controllers: [ServerController],
  providers: [ServerService],
})
export class ServerModule {}
