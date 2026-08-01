import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserFormDto } from './dto/create-user-form.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserFormDto } from './dto/update-user-form.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateProfileFormDto } from './dto/update-profile-form.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { UserVo, UserListVo } from './vo/user.vo';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permission } from '../../common/decorators/permission.decorator';
import { Log } from '../../common/decorators/log.decorator';
import { BusinessType } from '../../common/enums/business-type.enum';
import { FileService } from '../../common/services/file.service';
import { UploadPathEnum } from '../../common/enums/upload-path.enum';

@ApiTags('用户管理')
@Controller('user')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({ status: 200, description: '成功', type: UserListVo })
  @Permission('system:user:list')
  async findAll(@Query() query: QueryUserDto): Promise<UserListVo> {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '成功', type: UserVo })
  @Permission('system:user:query')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<UserVo | null> {
    return this.userService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建用户' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateUserFormDto })
  @ApiResponse({ status: 200, description: '成功' })
  @UseInterceptors(FileInterceptor('avatarFile'))
  @Permission('system:user:add')
  @Log('用户管理', BusinessType.INSERT)
  async create(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<void> {
    if (file) {
      const result = await this.fileService.saveFile(file, UploadPathEnum.AVATAR);
      createUserDto.avatar = result.accessUrl;
    }
    await this.userService.create(createUserDto, req.userInfo?.username);
  }

  @Put('profile')
  @ApiOperation({ summary: '修改个人信息' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateProfileFormDto })
  @ApiResponse({ status: 200, description: '成功' })
  @UseInterceptors(FileInterceptor('avatarFile'))
  @Log('个人信息', BusinessType.UPDATE)
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<void> {
    if (file) {
      const result = await this.fileService.saveFile(file, UploadPathEnum.AVATAR);
      updateProfileDto.avatar = result.accessUrl;
    }
    await this.userService.updateProfile(
      req.userInfo?.id,
      updateProfileDto,
      req.userInfo?.username,
    );
  }

  @Put('password')
  @ApiOperation({ summary: '修改自身密码' })
  @ApiResponse({ status: 200, description: '成功' })
  @Log('个人信息', BusinessType.UPDATE)
  async changeOwnPassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: any,
  ): Promise<void> {
    await this.userService.changePassword(
      req.userInfo?.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Put('avatar')
  @ApiOperation({ summary: '用户修改自身头像' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { avatarFile: { type: 'string', format: 'binary' } } } })
  @ApiResponse({ status: 200, description: '成功' })
  @UseInterceptors(FileInterceptor('avatarFile'))
  @Log('个人信息', BusinessType.UPDATE)
  async updateAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<void> {
    const result = await this.fileService.saveFile(file, UploadPathEnum.AVATAR);
    await this.userService.updateAvatar(req.userInfo?.id, result.accessUrl);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserFormDto })
  @ApiResponse({ status: 200, description: '成功' })
  @UseInterceptors(FileInterceptor('avatarFile'))
  @Permission('system:user:edit')
  @Log('用户管理', BusinessType.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<void> {
    if (file) {
      const result = await this.fileService.saveFile(file, UploadPathEnum.AVATAR);
      (updateUserDto as any).avatar = result.accessUrl;
    }
    await this.userService.update(id, updateUserDto, req.userInfo?.username);
  }

  @Delete('batch')
  @ApiOperation({ summary: '批量删除用户' })
  @ApiBody({ type: BatchDeleteDto })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:user:delete')
  @Log('用户管理', BusinessType.DELETE)
  async batchRemove(@Body() batchDeleteDto: BatchDeleteDto): Promise<void> {
    await this.userService.batchRemove(batchDeleteDto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除用户' })
  @Permission('system:user:delete')
  @Log('用户管理', BusinessType.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.remove(id);
  }

  @Put(':id/changePassword')
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:user:edit')
  @Log('用户管理', BusinessType.UPDATE)
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.userService.changePassword(
      id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Put(':id/resetPassword')
  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({ status: 200, description: '成功' })
  @Permission('system:user:resetPassword')
  @Log('用户管理', BusinessType.UPDATE)
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<void> {
    await this.userService.resetPassword(id, resetPasswordDto.newPassword);
  }

}
