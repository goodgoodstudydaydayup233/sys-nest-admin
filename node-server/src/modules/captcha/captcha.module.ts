import { Module } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { CaptchaController } from './captcha.controller';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService],
})
export class CaptchaModule {}
