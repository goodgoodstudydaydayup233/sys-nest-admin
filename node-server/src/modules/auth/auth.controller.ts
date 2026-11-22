import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { UserInfoDto } from '../../common/dto/user-info.dto';
import { RateLimiter } from '../../common/decorators/rate-limiter.decorator';
import { RateLimitType } from '../../common/enums/rate-limit-type.enum';

/**
 * 认证控制器
 * @description 登录/刷新/登出/获取路由等接口。
 *
 * @说明 不记录操作日志：
 * - 登录/登出/刷新 属于"登录日志"范畴，不在操作日志中记录
 * - 获取用户信息/路由 属于纯查询，无业务价值，不记录
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  // 登录接口加严限流：60 秒内同一 IP 最多 10 次，防止暴力破解
  @RateLimiter(60, 10, RateLimitType.IP)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(
      loginDto.username,
      loginDto.password,
      loginDto.captcha,
      loginDto.captchaKey,
      req,
    );
  }

  @Get('userInfo')
  @ApiOperation({ summary: '获取用户信息' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserInfo(@Req() req: Request) {
    return this.authService.getUserInfo(req.user!.id);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新Token' })
  // 刷新 Token 接口加严限流：60 秒内同一 IP 最多 10 次
  @RateLimiter(60, 10, RateLimitType.IP)
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: '退出登录' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(@Req() req: Request) {
    // 从请求头提取 token，传入 service 加入黑名单
    const authHeader = req.headers?.['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    return this.authService.logout(req.user!.id, token);
  }

  @Get('getRouters')
  @ApiOperation({ summary: '获取路由信息' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRouters(@User() user: UserInfoDto) {
    return this.authService.getRouters(user);
  }
}
