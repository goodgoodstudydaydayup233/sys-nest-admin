import { PartialType } from '@nestjs/swagger';
import { CreateFieldGroupDto } from './create-field-group.dto';

export class UpdateFieldGroupDto extends PartialType(CreateFieldGroupDto) {}
