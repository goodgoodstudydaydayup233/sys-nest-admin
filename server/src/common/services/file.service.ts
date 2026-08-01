import { Injectable, Logger } from '@nestjs/common';
import { join, extname } from 'path';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { UploadPathEnum } from '../enums/upload-path.enum';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCodeEnum } from '../enums/error-code.enum';
import { ConfigService as SysConfigService } from '../../modules/config/config.service';

/** 参数配置键：上传文件大小限制（MB） */
const CONFIG_KEY_UPLOAD_MAX_SIZE = 'sys.upload.maxSize';

export interface FileSaveResult {
  physicalPath: string;
  accessUrl: string;
}

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  constructor(private readonly sysConfigService: SysConfigService) {}

  /**
   * 保存文件到 uploads/{pathType}/ 目录
   *
   * @param file - Multer 文件对象（来自 FileInterceptor）
   * @param pathType - 保存子目录类型（UploadPathEnum）
   * @returns FileSaveResult 包含物理路径和访问 URL
   *
   * @description 保存前会校验文件大小，限制值从参数配置 sys.upload.maxSize 读取（MB）
   *
   * 使用示例：
   * const result = fileService.saveFile(file, UploadPathEnum.AVATAR);
   * // result.physicalPath → 'D:\project\uploads\avatar\1714567890-123456.png'
   * // result.accessUrl    → '/uploads/avatar/1714567890-123456.png'
   */
  async saveFile(file: Express.Multer.File, pathType: UploadPathEnum): Promise<FileSaveResult> {
    // 校验文件大小：从参数配置动态读取上限（MB），默认 10MB
    const maxSizeMB = parseInt(
      (await this.sysConfigService.getValueByKey(CONFIG_KEY_UPLOAD_MAX_SIZE)) || '10',
      10,
    );
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BusinessException(
        `上传文件大小超过限制（${maxSizeMB}MB）`,
        ErrorCodeEnum.PARAM_ERROR,
      );
    }

    const destDir = join(__dirname, '..', '..', '..', 'uploads', pathType);

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    const filename = this.generateFilename(file.originalname);
    const physicalPath = join(destDir, filename);
    const accessUrl = `/uploads/${pathType}/${filename}`;

    writeFileSync(physicalPath, file.buffer);

    this.logger.log(`文件已保存: ${accessUrl}`);

    return { physicalPath, accessUrl };
  }

  private generateFilename(originalName: string): string {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    return uniqueSuffix + extname(originalName);
  }
}
