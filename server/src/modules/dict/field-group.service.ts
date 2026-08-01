import { Injectable } from '@nestjs/common';
import { FieldGroupRepository } from './repository/field-group.repository';
import { QueryFieldGroupDto } from './dto/query-field-group.dto';
import { CreateFieldGroupDto } from './dto/create-field-group.dto';
import { UpdateFieldGroupDto } from './dto/update-field-group.dto';
import { FieldGroupVo, FieldGroupListVo } from './vo/field-group.vo';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';

@Injectable()
export class FieldGroupService {
  constructor(private readonly fieldGroupRepository: FieldGroupRepository) {}

  async findById(id: number): Promise<FieldGroupVo | null> {
    const group = await this.fieldGroupRepository.findById(id);
    return group ? this.toFieldGroupVo(group) : null;
  }

  async findAll(query: QueryFieldGroupDto): Promise<FieldGroupListVo> {
    const { list, total } = await this.fieldGroupRepository.findAll(query);

    return {
      list: list.map((group) => this.toFieldGroupVo(group)),
      total,
    };
  }

  async findAllActive(): Promise<FieldGroupVo[]> {
    const groups = await this.fieldGroupRepository.findAllActive();
    return groups.map((group) => this.toFieldGroupVo(group));
  }

  async create(createFieldGroupDto: CreateFieldGroupDto, username?: string): Promise<FieldGroupVo> {
    const existing = await this.fieldGroupRepository.findByCode(createFieldGroupDto.code);
    if (existing) {
      throw new BusinessException('分组编码已存在', ErrorCodeEnum.DICT_GROUP_ALREADY_EXISTS);
    }

    const group = await this.fieldGroupRepository.create({
      ...createFieldGroupDto,
      createdBy: username,
    });
    return this.toFieldGroupVo(group);
  }

  async update(id: number, updateFieldGroupDto: UpdateFieldGroupDto, username?: string): Promise<FieldGroupVo | null> {
    if (updateFieldGroupDto.code) {
      const existing = await this.fieldGroupRepository.findByCode(updateFieldGroupDto.code);
      if (existing && existing.id !== id) {
        throw new BusinessException('分组编码已存在', ErrorCodeEnum.DICT_GROUP_ALREADY_EXISTS);
      }
    }

    const group = await this.fieldGroupRepository.update(id, {
      ...updateFieldGroupDto,
      updatedBy: username,
    });
    return group ? this.toFieldGroupVo(group) : null;
  }

  async remove(id: number): Promise<void> {
    return this.fieldGroupRepository.remove(id);
  }

  async batchRemove(ids: number[]): Promise<void> {
    return this.fieldGroupRepository.batchRemove(ids);
  }

  private toFieldGroupVo(group: any): FieldGroupVo {
    return {
      id: group.id,
      name: group.name,
      code: group.code,
      sort: group.sort,
      status: group.status,
      remark: group.remark,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }
}
