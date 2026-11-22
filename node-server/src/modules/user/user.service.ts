import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { RoleRepository } from '../role/role.repository';
import { User } from './entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { QueryUserDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserVo, UserListVo } from './vo/user.vo';
import { BusinessException } from '../../common/exceptions/business.exception';
import { ErrorCodeEnum } from '../../common/enums/error-code.enum';
import { AuthCacheService } from '../auth/auth-cache.service';
import { AppConfigService } from '../../core/config/config.service';
import { ConfigService as SysConfigService } from '../config/config.service';

/** 参数配置键：用户默认密码 */
const CONFIG_KEY_DEFAULT_PASSWORD = 'sys.user.defaultPassword';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly authCacheService: AuthCacheService,
    private readonly configService: AppConfigService,
    private readonly sysConfigService: SysConfigService,
  ) {}

  async findById(id: number): Promise<UserVo | null> {
    const user = await this.userRepository.findById(id);
    return user ? this.toUserVo(user) : null;
  }

  async findByUsername(username: string) {
    return this.userRepository.findByUsername(username);
  }

  /**
   * 按 ID 加载用户及其角色、角色菜单
   * @description 供认证服务在用户信息缓存缺失时重建权限使用
   */
  async findByIdWithRolesMenus(id: number) {
    return this.userRepository.findByIdWithRolesMenus(id);
  }

  async findAll(query: QueryUserDto): Promise<UserListVo> {
    const { list, total } = await this.userRepository.findAll(query);

    return {
      list: list.map((user) => this.toUserVo(user)),
      total,
    };
  }

  async create(createUserDto: CreateUserDto, username?: string): Promise<UserVo> {
    const { roleIds, password, ...userData } = createUserDto;
    const existing = await this.userRepository.findByUsername(userData.username);
    if (existing) {
      throw new BusinessException('用户名已存在', ErrorCodeEnum.USER_ALREADY_EXISTS);
    }

    const roles = roleIds?.length ? await this.roleRepository.findByIds(roleIds) : [];

    // 密码处理：未传则使用系统默认密码（sys.user.defaultPassword），统一 bcrypt 加密
    const rawPassword =
      password || (await this.sysConfigService.getValueByKey(CONFIG_KEY_DEFAULT_PASSWORD)) || '123456';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
      roles,
      createdBy: username,
    });
    return this.toUserVo(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto, username?: string): Promise<UserVo | null> {
    const { roleIds, ...userData } = updateUserDto;

    // 超级管理员关键信息保护：禁止修改用户名、状态、角色
    if (await this.isSuperAdmin(id)) {
      const forbiddenFields: string[] = [];
      if (userData.username !== undefined) forbiddenFields.push('用户名');
      if (userData.status !== undefined) forbiddenFields.push('状态');
      if (roleIds !== undefined) forbiddenFields.push('角色');
      if (forbiddenFields.length) {
        throw new BusinessException(
          `超级管理员的关键信息（${forbiddenFields.join('、')}）不可修改`,
          ErrorCodeEnum.USER_CANNOT_MODIFY_ADMIN,
        );
      }
    }

    if (userData.username) {
      const current = await this.userRepository.findById(id);
      if (current && current.username !== userData.username) {
        const existing = await this.userRepository.findByUsername(userData.username);
        if (existing) {
          throw new BusinessException('用户名已存在', ErrorCodeEnum.USER_ALREADY_EXISTS);
        }
      }
    }

    const updateData: Partial<User> & { roles?: Role[] } = {
      ...userData,
      updatedBy: username,
    };

    if (roleIds !== undefined) {
      updateData.roles = roleIds?.length ? await this.roleRepository.findByIds(roleIds) : [];
    }

    const user = await this.userRepository.update(id, updateData);
    if (user) {
      await this.syncUserCache(id, user);
      // 账号被禁用：强制该用户所有在线会话下线（拉黑 token + 清缓存），使其下次请求跳转登录页
      if (userData.status === '0') {
        await this.authCacheService.forceLogoutUser(id);
      }
    }
    return user ? this.toUserVo(user) : null;
  }

  async remove(id: number): Promise<void> {
    await this.assertNotSuperAdmin(id, '删除');
    await this.userRepository.remove(id);
    // 用户被删除：强制其在线会话下线，避免残留会话继续访问
    await this.authCacheService.forceLogoutUser(id);
  }

  async batchRemove(ids: number[]): Promise<void> {
    for (const id of ids) {
      await this.assertNotSuperAdmin(id, '删除');
    }
    await this.userRepository.batchRemove(ids);
    for (const id of ids) {
      await this.authCacheService.forceLogoutUser(id);
    }
  }

  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    // 超管修改自己的密码请走 PUT /user/password 接口
    await this.assertNotSuperAdmin(id, '修改密码');

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BusinessException('用户不存在', ErrorCodeEnum.USER_NOT_FOUND);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BusinessException('旧密码错误', ErrorCodeEnum.USER_PASSWORD_ERROR);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(id, hashedPassword);
  }

  async resetPassword(id: number, newPassword: string): Promise<void> {
    // 超管修改自己的密码请走 PUT /user/password 接口
    await this.assertNotSuperAdmin(id, '重置密码');

    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BusinessException('用户不存在', ErrorCodeEnum.USER_NOT_FOUND);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updatePassword(id, hashedPassword);
  }

  async updateAvatar(id: number, avatar: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BusinessException('用户不存在', ErrorCodeEnum.USER_NOT_FOUND);
    }

    await this.userRepository.update(id, { avatar });

    const cached = await this.authCacheService.getUserCache(id);
    if (cached) {
      await this.authCacheService.setUserCache(id, {
        ...cached,
        avatar,
      });
    }
  }

  async updateProfile(id: number, updateProfileDto: UpdateProfileDto, username?: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new BusinessException('用户不存在', ErrorCodeEnum.USER_NOT_FOUND);
    }

    await this.userRepository.update(id, {
      ...updateProfileDto,
      updatedBy: username,
    });

    const updatedUser = await this.userRepository.findById(id);
    if (updatedUser) {
      await this.syncUserCache(id, updatedUser);
    }
  }

  private async syncUserCache(userId: number, user: User): Promise<void> {
    const cached = await this.authCacheService.getUserCache(userId);
    if (cached) {
      await this.authCacheService.setUserCache(userId, {
        ...cached,
        nickname: user.nickname,
        avatar: user.avatar,
      });
    }
  }

  /**
   * 判断指定用户是否为超级管理员
   * @description 通过配置中的 app.admin 用户名进行判断，避免硬编码 id
   * @param id 用户ID
   * @returns true-是超级管理员 false-不是或用户不存在
   */
  private async isSuperAdmin(id: number): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    if (!user) return false;
    return user.username === this.configService.app.admin;
  }

  /**
   * 断言指定用户不是超级管理员
   * @description 用于保护超级管理员不被其他用户操作（删除/重置密码等）
   * @param id 被操作的用户ID
   * @param action 操作名称（用于错误消息）
   */
  private async assertNotSuperAdmin(id: number, action: string): Promise<void> {
    if (await this.isSuperAdmin(id)) {
      throw new BusinessException(`超级管理员不可${action}`, ErrorCodeEnum.USER_CANNOT_MODIFY_ADMIN);
    }
  }

  private toUserVo(user: User): UserVo {
    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      status: user.status,
      sex: user.sex,
      remark: user.remark,
      roles: user.roles?.map((role) => ({
        id: role.id,
        name: role.name,
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
