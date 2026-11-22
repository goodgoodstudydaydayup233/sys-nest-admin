import { Injectable } from '@nestjs/common';
import * as svgCaptcha from 'svg-captcha';
import { RedisService } from '../../core/redis/redis.service';
import { ConfigService } from '../config/config.service';
import { ConfigKeyEnum } from '../../common/enums/config-key.enum';

@Injectable()
export class CaptchaService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async generate() {
    const captchaEnabled = await this.configService.getValueByKey(
      ConfigKeyEnum.LOGIN_CAPTCHA_ENABLED,
    );

    if (captchaEnabled === 'false') {
      return null;
    }

    const captcha = svgCaptcha.create({
      size: 4,
      ignoreChars: '0o1i',
      noise: 3,
      color: true,
      background: '#f5f5f5',
    });

    const key = this.generateKey();
    await this.redisService.setCaptcha(key, captcha.text);

    return {
      key,
      image: captcha.data,
    };
  }

  async verify(key: string, code: string): Promise<boolean> {
    const cachedCode = await this.redisService.getCaptcha(key);

    if (!cachedCode) {
      return false;
    }

    // 验证后立即删除
    await this.redisService.removeCaptcha(key);

    return cachedCode.toLowerCase() === code.toLowerCase();
  }

  private generateKey(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}
