import { Controller, Get } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('验证码')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get()
  @ApiOperation({ summary: '登录时获取验证码 - 返回为data空时为无需验证码' })
  async generate() {
    return this.captchaService.generate();
  }
}
