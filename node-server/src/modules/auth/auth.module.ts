import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { CaptchaModule } from '../captcha/captcha.module';
import { AuthCacheModule } from './auth-cache.module';
import { ConfigModule } from '../config/config.module';
import { AppConfigModule } from '../../core/config/config.module';
import { AppConfigService } from '../../core/config/config.service';
import { Menu } from '../menu/entities/menu.entity';
import { MenuRepository } from '../menu/menu.repository';
import { LogModule } from '../log/log.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      inject: [AppConfigService],
      useFactory: (configService: AppConfigService) => ({
        secret: configService.jwt.secret,
        signOptions: { expiresIn: configService.jwt.accessTokenExpiresIn as any },
      }),
    }),
    TypeOrmModule.forFeature([Menu]),
    UserModule,
    CaptchaModule,
    AuthCacheModule,
    ConfigModule,
    AppConfigModule,
    LogModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MenuRepository],
  exports: [AuthService],
})
export class AuthModule {}
