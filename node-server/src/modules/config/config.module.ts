import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { ConfigRepository } from './config.repository';
import { Config } from './entities/config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Config])],
  controllers: [ConfigController],
  providers: [ConfigService, ConfigRepository],
  exports: [ConfigService],
})
export class ConfigModule {}
