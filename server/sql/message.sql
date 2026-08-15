-- ============================================
-- 站内信模块数据库脚本
-- 1. 创建 sys_message 表（TypeORM synchronize 也会自动同步，此处确保提前存在）
-- 2. 插入站内信菜单/按钮（系统管理目录 1002 下）
-- 3. 绑定角色（角色 1 = 超级管理员）
-- ============================================

-- ----------------------------
-- 1. 表结构
-- ----------------------------
CREATE TABLE IF NOT EXISTS `sys_message` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `deleteStatus` char(1) NOT NULL DEFAULT '0' COMMENT '删除状态: 0-未删除 1-已删除',
  `disabled` char(1) NOT NULL DEFAULT '0' COMMENT '禁用状态: 0-启用 1-禁用',
  `createdBy` varchar(50) NULL DEFAULT NULL COMMENT '创建者',
  `updatedBy` varchar(50) NULL DEFAULT NULL COMMENT '更新者',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  `senderName` varchar(50) NOT NULL COMMENT '发送者用户名',
  `receiverId` int NOT NULL COMMENT '接收用户ID',
  `receiverName` varchar(50) NOT NULL COMMENT '接收用户名',
  `title` varchar(100) NOT NULL COMMENT '消息标题',
  `content` text NULL COMMENT '消息内容',
  `type` char(1) NOT NULL DEFAULT '1' COMMENT '消息类型: 1-系统通知 2-业务提醒 3-任务结果',
  `status` char(1) NOT NULL DEFAULT '0' COMMENT '状态: 0-未读 1-已读',
  `readAt` datetime(6) NULL DEFAULT NULL COMMENT '读取时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `IDX_message_receiver` (`receiverId`, `deleteStatus`) USING BTREE,
  INDEX `IDX_message_receiver_status` (`receiverId`, `status`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 DEFAULT CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC COMMENT = '站内信';

-- ----------------------------
-- 2. 菜单数据（目录：系统管理 1002）
-- ----------------------------
INSERT INTO `sys_menu` (`id`, `parentId`, `path`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `disabled`, `deleteStatus`, `visible`, `menuName`, `orderNum`, `query`, `isFrame`, `isCache`, `menuType`, `perms`, `component`, `icon`)
VALUES (1038, 1002, 'message', '2026-08-15 00:00:00.000000', '2026-08-15 00:00:00.000000', 'admin', 'admin', '0', '0', '0', '站内信', 6, '', '1', '0', 'C', 'system:message:list', 'system/message/index', 'ChatDotRound');

INSERT INTO `sys_menu` (`id`, `parentId`, `path`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `disabled`, `deleteStatus`, `visible`, `menuName`, `orderNum`, `query`, `isFrame`, `isCache`, `menuType`, `perms`, `component`, `icon`)
VALUES (10381, 1038, NULL, '2026-08-15 00:00:00.000000', '2026-08-15 00:00:00.000000', 'admin', NULL, '0', '0', '0', '站内信发送', 1, '', '1', '0', 'F', 'system:message:send', NULL, '#');

INSERT INTO `sys_menu` (`id`, `parentId`, `path`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `disabled`, `deleteStatus`, `visible`, `menuName`, `orderNum`, `query`, `isFrame`, `isCache`, `menuType`, `perms`, `component`, `icon`)
VALUES (10382, 1038, NULL, '2026-08-15 00:00:00.000000', '2026-08-15 00:00:00.000000', 'admin', NULL, '0', '0', '0', '站内信查看', 2, '', '1', '0', 'F', 'system:message:query', NULL, '#');

INSERT INTO `sys_menu` (`id`, `parentId`, `path`, `createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `disabled`, `deleteStatus`, `visible`, `menuName`, `orderNum`, `query`, `isFrame`, `isCache`, `menuType`, `perms`, `component`, `icon`)
VALUES (10383, 1038, NULL, '2026-08-15 00:00:00.000000', '2026-08-15 00:00:00.000000', 'admin', NULL, '0', '0', '0', '站内信删除', 3, '', '1', '0', 'F', 'system:message:remove', NULL, '#');

-- ----------------------------
-- 3. 角色菜单绑定（角色 1 超级管理员）
-- ----------------------------
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 1038);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 10381);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 10382);
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`) VALUES (1, 10383);
