import { Injectable } from '@nestjs/common';
import { DictTypeRepository } from './repository/dict-type.repository';
import { DictDataRepository } from './repository/dict-data.repository';
import { QueryDictTypeDto } from './dto/query-dict-type.dto';
import { CreateDictTypeDto } from './dto/create-dict-type.dto';
import { UpdateDictTypeDto } from './dto/update-dict-type.dto';
import { DictTypeVo, DictTypeListVo } from './vo/dict-type.vo';
import { DictDataVo } from './vo/dict-data.vo';
import { DictCacheService } from './dict-cache.service';
import { DictDataService } from './dict-data.service';
import { DictType } from './entities/dict-type.entity';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';

@Injectable()
export class DictTypeService {
  constructor(
    private readonly dictTypeRepository: DictTypeRepository,
    private readonly dictDataRepository: DictDataRepository,
    private readonly dictCacheService: DictCacheService,
    private readonly dictDataService: DictDataService,
  ) {}

  async findById(id: number): Promise<DictTypeVo | null> {
    const dictType = await this.dictTypeRepository.findById(id);
    return dictType ? this.toDictTypeVo(dictType) : null;
  }

  async findAll(query: QueryDictTypeDto): Promise<DictTypeListVo> {
    const { list, total } = await this.dictTypeRepository.findAll(query);

    return {
      list: list.map((dictType) => this.toDictTypeVo(dictType)),
      total,
    };
  }

  async create(createDictTypeDto: CreateDictTypeDto, username?: string): Promise<DictTypeVo> {
    const existing = await this.dictTypeRepository.findByType(createDictTypeDto.type);
    if (existing) {
      throw new BusinessException('字典类型已存在', ErrorCodeEnum.DICT_TYPE_ALREADY_EXISTS);
    }

    const dictType = await this.dictTypeRepository.create({
      ...createDictTypeDto,
      createdBy: username,
    });
    return this.toDictTypeVo(dictType);
  }

  async update(id: number, updateDictTypeDto: UpdateDictTypeDto, username?: string): Promise<DictTypeVo | null> {
    const before = await this.dictTypeRepository.findById(id);
    if (!before) {
      throw new BusinessException('字典类型不存在', ErrorCodeEnum.DICT_TYPE_NOT_FOUND);
    }

    if (updateDictTypeDto.type && updateDictTypeDto.type !== before.type) {
      const existing = await this.dictTypeRepository.findByType(updateDictTypeDto.type);
      if (existing && existing.id !== id) {
        throw new BusinessException('字典类型已存在', ErrorCodeEnum.DICT_TYPE_ALREADY_EXISTS);
      }
    }

    const dictType = await this.dictTypeRepository.update(id, {
      ...updateDictTypeDto,
      updatedBy: username,
    });

    // 如果 type 标识变更，旧标识和新标识缓存都要失效
    if (updateDictTypeDto.type && updateDictTypeDto.type !== before.type) {
      await this.dictCacheService.invalidateByType(before.type);
      await this.dictCacheService.invalidateByType(updateDictTypeDto.type);
    } else if (updateDictTypeDto.status !== undefined || updateDictTypeDto.name !== undefined) {
      // 状态或名称变更也需失效（因为 findByDictType 内层过滤了 status='1'）
      await this.dictCacheService.invalidateByType(before.type);
    }

    return dictType ? this.toDictTypeVo(dictType) : null;
  }

  /**
   * 删除字典类型
   * @description 级联删除其下所有字典数据，并清缓存
   */
  async remove(id: number): Promise<void> {
    const dictType = await this.dictTypeRepository.findById(id);
    if (!dictType) {
      throw new BusinessException('字典类型不存在', ErrorCodeEnum.DICT_TYPE_NOT_FOUND);
    }

    // 级联软删除其下所有字典数据
    await this.dictDataRepository.softDeleteByTypeId(id);

    // 删除字典类型本身
    await this.dictTypeRepository.remove(id);

    // 失效该 type 缓存
    await this.dictCacheService.invalidateByType(dictType.type);
  }

  /**
   * 批量删除字典类型
   * @description 逐个级联删除（避免循环依赖，单条调用 remove）
   */
  async batchRemove(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.remove(id);
    }
  }

  /**
   * 刷新所有字典缓存
   * @description 清空所有字典缓存，可由管理员手动触发
   */
  async refreshCache(): Promise<{ count: number }> {
    await this.dictCacheService.clearAll();

    // 重新预加载所有启用字典类型的字典数据
    const types = await this.dictTypeRepository.findAllActive();
    let count = 0;
    for (const type of types) {
      const dataList: DictDataVo[] = await this.dictDataService.findByTypeId(type.id);
      await this.dictCacheService.set(type.type, dataList);
      count++;
    }
    return { count };
  }

  private toDictTypeVo(dictType: DictType): DictTypeVo {
    return {
      id: dictType.id,
      name: dictType.name,
      type: dictType.type,
      groupId: dictType.groupId,
      groupName: dictType.group?.name,
      sort: dictType.sort,
      status: dictType.status,
      remark: dictType.remark,
      createdAt: dictType.createdAt,
      updatedAt: dictType.updatedAt,
    };
  }
}
