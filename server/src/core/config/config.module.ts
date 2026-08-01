import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config.service';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

const env = process.env.NODE_ENV || 'development';
const configPath = path.join(process.cwd(), `config/${env}.yml`);
const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as Record<string, any>;

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [() => config],
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
