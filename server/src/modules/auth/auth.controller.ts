import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { UserInfoDto } from '../../common/dto/user-info.dto';

/**
 * 认证控制器
 * @description 登录/刷新/登出/获取路由等接口。
 *
 * @说明 不记录操作日志：
 * - 登录/登出/刷新 属于"登录日志"范畴（对标若依 sys_logininfor），不在操作日志中记录
 * - 获取用户信息/路由 属于纯查询，无业务价值，不记录
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
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
  async getUserInfo(@Req() req: any) {
    return this.authService.getUserInfo(req.user.id);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新Token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: '退出登录' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async logout(@Req() req: any) {
    // 从请求头提取 token，传入 service 加入黑名单
    const authHeader = req.headers?.['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    return this.authService.logout(req.user.id, token);
  }

  @Get('getRouters')
  @ApiOperation({ summary: '获取路由信息' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getRouters(@User() user: UserInfoDto) {
    return this.authService.getRouters(user);
  }
}
