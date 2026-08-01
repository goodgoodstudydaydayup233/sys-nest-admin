import { Module, Global } from '@nestjs/common';
import { FileService } from './file.service';
import { ConfigModule } from '../../modules/config/config.module';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
