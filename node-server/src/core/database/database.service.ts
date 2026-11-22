import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onModuleInit() {
    try {
      await this.dataSource.query('SELECT 1');
      this.logger.log('数据库连接成功，表结构同步完成');
    } catch (error) {
      this.logger.error('数据库连接失败，表结构同步异常', error);
    }
  }
}
