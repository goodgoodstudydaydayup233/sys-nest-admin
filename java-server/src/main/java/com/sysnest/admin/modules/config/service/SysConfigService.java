package com.sysnest.admin.modules.config.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.modules.config.dto.ConfigQuery;
import com.sysnest.admin.modules.config.dto.ConfigSaveDto;
import com.sysnest.admin.modules.config.entity.SysConfig;
import com.sysnest.admin.modules.config.mapper.SysConfigMapper;
import com.sysnest.admin.modules.config.vo.ConfigVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;

/**
 * 参数配置服务：Redis 优先，查不到再读库并缓存
 * 对应 Nest 端的 config 缓存逻辑
 */
@Service
@RequiredArgsConstructor
public class SysConfigService {

    /** 业务键前缀，实际键为 java:config:xxx */
    private static final String CACHE_PREFIX = "config:";

    private final SysConfigMapper sysConfigMapper;
    private final RedisUtils redisUtils;

    /**
     * 按键取值，没有配置返回 null
     */
    public String getValue(String configKey) {
        Object cached = redisUtils.get(CACHE_PREFIX + configKey);
        if (cached != null) {
            return String.valueOf(cached);
        }

        SysConfig config = sysConfigMapper.selectOne(
                Wrappers.<SysConfig>lambdaQuery().eq(SysConfig::getConfigKey, configKey));
        if (config == null) {
            return null;
        }

        // 配置永久缓存，后续刷新缓存时统一清理
        redisUtils.set(CACHE_PREFIX + configKey, config.getConfigValue());
        return config.getConfigValue();
    }

    /**
     * 取整数配置，缺失或格式错误时使用默认值
     */
    public int getIntValue(String configKey, int defaultValue) {
        String value = getValue(configKey);
        if (value == null || value.isBlank()) {
            return defaultValue;
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    /**
     * 清除某个配置的缓存
     */
    public void evict(String configKey) {
        redisUtils.delete(CACHE_PREFIX + configKey);
    }

    public PageResult<ConfigVo> page(ConfigQuery query) {
        Page<SysConfig> page = sysConfigMapper.selectPage(query.toPage(), Wrappers.<SysConfig>lambdaQuery()
                .like(StringUtils.hasText(query.getName()), SysConfig::getName, query.getName())
                .eq(StringUtils.hasText(query.getGroup()), SysConfig::getGroupName, query.getGroup())
                .orderByDesc(SysConfig::getCreatedAt));
        List<ConfigVo> list = page.getRecords().stream().map(this::toVo).toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    public ConfigVo detail(Integer id) {
        SysConfig config = sysConfigMapper.selectById(id);
        return config == null ? null : toVo(config);
    }

    /**
     * 按键取值，空值返回 null（前端约定）
     */
    public String getValueOrNull(String configKey) {
        String value = getValue(configKey);
        return StringUtils.hasText(value) ? value : null;
    }

    public void create(ConfigSaveDto dto) {
        if (!StringUtils.hasText(dto.getConfigKey())
                || !StringUtils.hasText(dto.getConfigValue())
                || !StringUtils.hasText(dto.getName())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "键名、键值和名称不能为空");
        }
        if (existsKey(dto.getConfigKey(), null)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "配置键已存在");
        }
        SysConfig config = new SysConfig();
        config.setConfigKey(dto.getConfigKey());
        config.setConfigValue(dto.getConfigValue());
        config.setName(dto.getName());
        config.setGroupName(StringUtils.hasText(dto.getGroup()) ? dto.getGroup() : "system");
        config.setRemark(dto.getRemark());
        sysConfigMapper.insert(config);

        redisUtils.set(CACHE_PREFIX + config.getConfigKey(), config.getConfigValue());
    }

    public void update(Integer id, ConfigSaveDto dto) {
        SysConfig config = sysConfigMapper.selectById(id);
        if (config == null) {
            throw new BusinessException(ErrorCode.CONFIG_NOT_FOUND);
        }
        String oldKey = config.getConfigKey();
        if (StringUtils.hasText(dto.getConfigKey()) && !dto.getConfigKey().equals(oldKey)
                && existsKey(dto.getConfigKey(), id)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "配置键已存在");
        }

        if (dto.getConfigKey() != null) {
            config.setConfigKey(dto.getConfigKey());
        }
        if (dto.getConfigValue() != null) {
            config.setConfigValue(dto.getConfigValue());
        }
        if (dto.getName() != null) {
            config.setName(dto.getName());
        }
        if (dto.getGroup() != null) {
            config.setGroupName(dto.getGroup());
        }
        if (dto.getRemark() != null) {
            config.setRemark(dto.getRemark());
        }
        sysConfigMapper.updateById(config);

        evict(oldKey);
        redisUtils.set(CACHE_PREFIX + config.getConfigKey(), config.getConfigValue());
    }

    public void delete(Integer id) {
        SysConfig config = sysConfigMapper.selectById(id);
        if (config == null) {
            return;
        }
        sysConfigMapper.deleteById(id);
        evict(config.getConfigKey());
    }

    /**
     * 清空配置缓存，再把启用配置逐条预热，返回条数
     */
    public int refreshCache() {
        Set<String> keys = redisUtils.scan(CACHE_PREFIX + "*");
        keys.forEach(redisUtils::delete);

        List<SysConfig> configs = sysConfigMapper.selectList(Wrappers.<SysConfig>lambdaQuery()
                .eq(SysConfig::getDisabled, "0"));
        for (SysConfig config : configs) {
            redisUtils.set(CACHE_PREFIX + config.getConfigKey(), config.getConfigValue());
        }
        return configs.size();
    }

    private boolean existsKey(String configKey, Integer excludeId) {
        return sysConfigMapper.selectCount(Wrappers.<SysConfig>lambdaQuery()
                .eq(SysConfig::getConfigKey, configKey)
                .ne(excludeId != null, SysConfig::getId, excludeId)) > 0;
    }

    private ConfigVo toVo(SysConfig config) {
        ConfigVo vo = new ConfigVo();
        BeanUtils.copyProperties(config, vo);
        vo.setGroup(config.getGroupName());
        return vo;
    }
}
