import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        type: configService.database.type,
        host: configService.database.host,
        port: configService.database.port,
        username: configService.database.username,
        password: configService.database.password,
        database: configService.database.database,
        entities: [__dirname + '/../../modules/**/entities/*.entity{.ts,.js}'],
        synchronize: configService.database.synchronize,
        logging: configService.database.logging,
        extra: {
          foreignKeyChecks: false,
        },
      }),
    }),
  ],
  providers: [DatabaseService],
})
export class DatabaseModule {}
