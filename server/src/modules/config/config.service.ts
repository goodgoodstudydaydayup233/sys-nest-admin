import { Injectable } from '@nestjs/common';
import { ConfigRepository } from './config.repository';
import { Config } from './entities/config.entity';
import { QueryConfigDto } from './dto/query-config.dto';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { ConfigVo, ConfigListVo } from './vo/config.vo';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';
import { RedisService } from '../../core/redis/redis.service';

/**
 * 参数配置服务
 * @description 对标若依 sys_config，采用缓存优先策略：
 * - 读取（getValueByKey）：先查 Redis 缓存，未命中查数据库并回写缓存
 * - 写入（create/update/remove）：同步失效对应 key 的缓存
 * - 刷新（refreshCache）：清空所有配置缓存，重新预热
 *
 * @缓存设计动机
 * 参数配置（如验证码开关、系统名称）属于读多写少的高频数据，缓存可显著降低数据库压力。
 */
@Injectable()
export class ConfigService {
  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly redisService: RedisService,
  ) {}

  async findById(id: number): Promise<ConfigVo | null> {
    const config = await this.configRepository.findById(id);
    return config ? this.toConfigVo(config) : null;
  }

  async findByKey(configKey: string): Promise<Config | null> {
    return this.configRepository.findByKey(configKey);
  }

  /**
   * 根据配置键获取值（缓存优先）
   * @description 先查 Redis，未命中查数据库并回写缓存
   */
  async getValueByKey(configKey: string): Promise<string | null> {
    // 1. 先查缓存
    const cached = await this.redisService.getConfigCache(configKey);
    if (cached !== null) {
      return cached;
    }

    // 2. 缓存未命中，查数据库
    const config = await this.configRepository.findByKey(configKey);
    const value = config?.configValue || '';

    // 3. 回写缓存（即使为空也缓存，避免缓存穿透）
    await this.redisService.setConfigCache(configKey, value);

    return value || null;
  }

  async findAll(query: QueryConfigDto): Promise<ConfigListVo> {
    const { list, total } = await this.configRepository.findAll(query);
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;

    return {
      list: list.map((config) => this.toConfigVo(config)),
      total,
      page,
      pageSize,
    };
  }

  async create(createConfigDto: CreateConfigDto, username: string): Promise<ConfigVo> {
    const existing = await this.configRepository.findByKey(createConfigDto.configKey);
    if (existing) {
      throw new BusinessException('配置键已存在', ErrorCodeEnum.PARAM_ERROR);
    }

    const config = await this.configRepository.create({
      ...createConfigDto,
      createdBy: username,
    });

    // 写入后同步缓存
    await this.redisService.setConfigCache(config.configKey, config.configValue);

    return this.toConfigVo(config);
  }

  async update(
    id: number,
    updateConfigDto: UpdateConfigDto,
    username: string,
  ): Promise<ConfigVo | null> {
    // 查询旧 key（key 可能被修改，需要失效旧缓存）
    const oldConfig = await this.configRepository.findById(id);
    const oldKey = oldConfig?.configKey;

    const config = await this.configRepository.update(id, {
      ...updateConfigDto,
      updatedBy: username,
    });

    if (config) {
      // 失效旧 key 缓存
      if (oldKey && oldKey !== config.configKey) {
        await this.redisService.removeConfigCache(oldKey);
      }
      // 更新新 key 缓存
      await this.redisService.setConfigCache(config.configKey, config.configValue);
    }

    return config ? this.toConfigVo(config) : null;
  }

  async remove(id: number): Promise<void> {
    // 查询被删除的 key，用于失效缓存
    const config = await this.configRepository.findById(id);
    await this.configRepository.remove(id);
    if (config?.configKey) {
      await this.redisService.removeConfigCache(config.configKey);
    }
  }

  /**
   * 刷新所有参数配置缓存
   * @description 清空所有配置缓存，重新从数据库加载全部配置并预热缓存
   * @returns 预热的配置数量
   */
  async refreshCache(): Promise<number> {
    // 1. 清空所有配置缓存
    await this.redisService.clearConfigCache();

    // 2. 查询所有配置并预热缓存
    const configs = await this.configRepository.findAllActive();
    for (const config of configs) {
      await this.redisService.setConfigCache(config.configKey, config.configValue || '');
    }

    return configs.length;
  }

  private toConfigVo(config: any): ConfigVo {
    return {
      id: config.id,
      configKey: config.configKey,
      configValue: config.configValue,
      name: config.name,
      group: config.group,
      remark: config.remark,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
