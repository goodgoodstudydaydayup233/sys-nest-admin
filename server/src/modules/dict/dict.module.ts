import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldGroupService } from './field-group.service';
import { FieldGroupController } from './field-group.controller';
import { FieldGroupRepository } from './repository/field-group.repository';
import { FieldGroup } from './entities/field-group.entity';
import { DictTypeService } from './dict-type.service';
import { DictTypeController } from './dict-type.controller';
import { DictTypeRepository } from './repository/dict-type.repository';
import { DictType } from './entities/dict-type.entity';
import { DictDataService } from './dict-data.service';
import { DictDataController } from './dict-data.controller';
import { DictDataRepository } from './repository/dict-data.repository';
import { DictData } from './entities/dict-data.entity';
import { DictCacheService } from './dict-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([FieldGroup, DictType, DictData])],
  controllers: [FieldGroupController, DictTypeController, DictDataController],
  providers: [
    FieldGroupService,
    FieldGroupRepository,
    DictTypeService,
    DictTypeRepository,
    DictDataService,
    DictDataRepository,
    DictCacheService,
  ],
  exports: [FieldGroupService, DictTypeService, DictDataService, DictCacheService],
})
export class DictModule {}
