import { Module } from '@nestjs/common';
import { AuthCacheService } from './auth-cache.service';

@Module({
  providers: [AuthCacheService],
  exports: [AuthCacheService],
})
export class AuthCacheModule {}
