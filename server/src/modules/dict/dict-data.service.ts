import { Injectable } from '@nestjs/common';
import { DictDataRepository } from './repository/dict-data.repository';
import { DictTypeRepository } from './repository/dict-type.repository';
import { QueryDictDataDto } from './dto/query-dict-data.dto';
import { CreateDictDataDto } from './dto/create-dict-data.dto';
import { UpdateDictDataDto } from './dto/update-dict-data.dto';
import { DictDataVo, DictDataListVo } from './vo/dict-data.vo';
import { DictCacheService } from './dict-cache.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';

@Injectable()
export class DictDataService {
  constructor(
    private readonly dictDataRepository: DictDataRepository,
    private readonly dictTypeRepository: DictTypeRepository,
    private readonly dictCacheService: DictCacheService,
  ) {}

  async findById(id: number): Promise<DictDataVo | null> {
    const data = await this.dictDataRepository.findById(id);
    return data ? this.toDictDataVo(data) : null;
  }

  async findByTypeId(typeId: number): Promise<DictDataVo[]> {
    const list = await this.dictDataRepository.findByTypeId(typeId);
    return list.map((data) => this.toDictDataVo(data));
  }

  /**
   * 根据字典类型字符串获取字典数据（走缓存）
   * @description 读穿透：缓存未命中则查库并回填
   * @param dictType 字典类型标识
   */
  async findByDictType(dictType: string): Promise<DictDataVo[]> {
    // 1. 先读缓存
    const cached = await this.dictCacheService.get(dictType);
    if (cached) {
      return cached;
    }

    // 2. 缓存未命中，查库
    const list = await this.dictDataRepository.findByDictType(dictType);
    const voList = list.map((data) => this.toDictDataVo(data));

    // 3. 回填缓存
    if (voList.length > 0) {
      await this.dictCacheService.set(dictType, voList);
    }
    return voList;
  }

  async findAll(query: QueryDictDataDto): Promise<DictDataListVo> {
    const { list, total } = await this.dictDataRepository.findAll(query);

    return {
      list: list.map((data) => this.toDictDataVo(data)),
      total,
    };
  }

  async create(createDictDataDto: CreateDictDataDto, username?: string): Promise<DictDataVo> {
    const data = await this.dictDataRepository.create({
      ...createDictDataDto,
      createdBy: username,
    });
    // 失效该字典类型缓存
    await this.invalidateCacheByTypeId(createDictDataDto.typeId);
    return this.toDictDataVo(data);
  }

  async update(id: number, updateDictDataDto: UpdateDictDataDto, username?: string): Promise<DictDataVo | null> {
    // 修改前查询原数据，用于失效旧 typeId 对应缓存
    const before = await this.dictDataRepository.findById(id);
    if (!before) {
      throw new BusinessException('字典数据不存在', ErrorCodeEnum.DICT_DATA_NOT_FOUND);
    }

    const data = await this.dictDataRepository.update(id, {
      ...updateDictDataDto,
      updatedBy: username,
    });

    // 失效旧 typeId 缓存
    await this.invalidateCacheByTypeId(before.typeId);
    // 如果 typeId 变更，也失效新 typeId 缓存
    if (updateDictDataDto.typeId && updateDictDataDto.typeId !== before.typeId) {
      await this.invalidateCacheByTypeId(updateDictDataDto.typeId);
    }

    return data ? this.toDictDataVo(data) : null;
  }

  async remove(id: number): Promise<void> {
    const before = await this.dictDataRepository.findById(id);
    if (!before) {
      throw new BusinessException('字典数据不存在', ErrorCodeEnum.DICT_DATA_NOT_FOUND);
    }
    await this.dictDataRepository.remove(id);
    await this.invalidateCacheByTypeId(before.typeId);
  }

  async batchRemove(ids: number[]): Promise<void> {
    // 收集所有涉及的 typeId 用于失效缓存
    const typeIds = new Set<number>();
    for (const id of ids) {
      const data = await this.dictDataRepository.findById(id);
      if (data) {
        typeIds.add(data.typeId);
      }
    }
    await this.dictDataRepository.batchRemove(ids);
    for (const typeId of typeIds) {
      await this.invalidateCacheByTypeId(typeId);
    }
  }

  /**
   * 根据 typeId 失效对应字典类型缓存
   * @description 内部方法：先查 typeId 对应的 type 字符串，再清缓存
   */
  private async invalidateCacheByTypeId(typeId: number): Promise<void> {
    const dictType = await this.dictTypeRepository.findById(typeId);
    if (dictType) {
      await this.dictCacheService.invalidateByType(dictType.type);
    }
  }

  private toDictDataVo(data: any): DictDataVo {
    return {
      id: data.id,
      label: data.label,
      value: data.value,
      typeId: data.typeId,
      cssClass: data.cssClass,
      listClass: data.listClass,
      sort: data.sort,
      status: data.status,
      remark: data.remark,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
