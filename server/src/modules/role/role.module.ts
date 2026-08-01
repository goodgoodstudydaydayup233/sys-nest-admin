import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { RoleRepository } from './role.repository';
import { Role } from './entities/role.entity';
import { Menu } from '../menu/entities/menu.entity';
import { MenuRepository } from '../menu/menu.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Role, Menu])],
  controllers: [RoleController],
  providers: [RoleService, RoleRepository, MenuRepository],
  exports: [RoleService],
})
export class RoleModule {}
