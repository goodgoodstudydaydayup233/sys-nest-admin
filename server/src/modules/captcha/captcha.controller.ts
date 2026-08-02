import { Controller, Get } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RateLimiter } from '../../common/decorators/rate-limiter.decorator';
import { RateLimitType } from '../../common/enums/rate-limit-type.enum';

@ApiTags('验证码')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  @ApiOperation({ summary: '登录时获取验证码 - 返回为data空时为无需验证码' })
  // 验证码接口加严限流：60 秒内同一 IP 最多 10 次，防止刷验证码消耗服务器资源
  @RateLimiter(60, 10, RateLimitType.IP)
  async generate() {
    return this.captchaService.generate();
  }
}
