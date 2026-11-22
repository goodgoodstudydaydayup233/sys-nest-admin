package com.sysnest.admin.modules.dict.service;

import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.modules.dict.entity.DictData;
import com.sysnest.admin.modules.dict.entity.DictType;
import com.sysnest.admin.modules.dict.mapper.DictDataMapper;
import com.sysnest.admin.modules.dict.mapper.DictTypeMapper;
import com.sysnest.admin.modules.dict.vo.DictCacheData;
import com.sysnest.admin.modules.dict.vo.DictDataVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

/**
 * 字典缓存，相当于 Nest 的 dict-cache.service.ts
 * 键：dict:data:{dictType}，永久缓存，由 CRUD 主动失效
 */
@Service
@RequiredArgsConstructor
public class DictCacheService {

    private static final String PREFIX = "dict:data:";

    private final RedisUtils redisUtils;
    private final DictDataMapper dictDataMapper;
    private final DictTypeMapper dictTypeMapper;

    /**
     * 按字典类型取启用数据，缓存优先；空列表不缓存
     */
    public List<DictDataVo> get(String dictType) {
        String key = PREFIX + dictType;
        try {
            Object cached = redisUtils.get(key);
            if (cached instanceof DictCacheData data) {
                return data.getList();
            }
        } catch (Exception e) {
            // 旧格式或损坏的缓存直接删掉，回源重建
            redisUtils.delete(key);
        }

        List<DictDataVo> data = load(dictType);
        if (!data.isEmpty()) {
            redisUtils.set(key, new DictCacheData(data));
        }
        return data;
    }

    public void evict(String dictType) {
        if (dictType != null) {
            redisUtils.delete(PREFIX + dictType);
        }
    }

    /**
     * 清空所有字典缓存，返回删除的键数量
     */
    public int clearAll() {
        Set<String> keys = redisUtils.scan(PREFIX + "*");
        keys.forEach(redisUtils::delete);
        return keys.size();
    }

    /**
     * 刷新缓存：清空后按所有启用类型重新预热，返回类型数量
     */
    public int refreshAll() {
        clearAll();
        List<DictType> types = dictTypeMapper.selectEnabledTypes();
        for (DictType type : types) {
            List<DictDataVo> data = load(type.getType());
            if (!data.isEmpty()) {
                redisUtils.set(PREFIX + type.getType(), new DictCacheData(data));
            }
        }
        return types.size();
    }

    private List<DictDataVo> load(String dictType) {
        return dictDataMapper.selectEnabledByType(dictType).stream()
                .map(this::toVo)
                .toList();
    }

    private DictDataVo toVo(DictData data) {
        DictDataVo vo = new DictDataVo();
        BeanUtils.copyProperties(data, vo);
        return vo;
    }
}
