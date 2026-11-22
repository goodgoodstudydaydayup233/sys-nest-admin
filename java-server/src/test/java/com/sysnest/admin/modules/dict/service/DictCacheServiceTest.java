package com.sysnest.admin.modules.dict.service;

import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.modules.dict.entity.DictData;
import com.sysnest.admin.modules.dict.mapper.DictDataMapper;
import com.sysnest.admin.modules.dict.mapper.DictTypeMapper;
import com.sysnest.admin.modules.dict.vo.DictCacheData;
import com.sysnest.admin.modules.dict.vo.DictDataVo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 字典缓存单元测试：缓存命中、未命中回源、主动失效
 */
@ExtendWith(MockitoExtension.class)
class DictCacheServiceTest {

    @Mock
    private RedisUtils redisUtils;

    @Mock
    private DictDataMapper dictDataMapper;

    @Mock
    private DictTypeMapper dictTypeMapper;

    @InjectMocks
    private DictCacheService dictCacheService;

    @Test
    void returnsCachedDataWithoutQueryingDatabase() {
        DictDataVo cached = new DictDataVo();
        cached.setLabel("启用");
        cached.setValue("true");
        when(redisUtils.get("dict:data:status"))
                .thenReturn(new DictCacheData(List.of(cached)));

        List<DictDataVo> result = dictCacheService.get("status");

        assertEquals(1, result.size());
        assertEquals("启用", result.get(0).getLabel());
        verify(dictDataMapper, never()).selectEnabledByType(any());
    }

    @Test
    void loadsFromDatabaseAndWritesCacheOnMiss() {
        when(redisUtils.get("dict:data:status")).thenReturn(null);
        DictData data = new DictData();
        data.setLabel("禁用");
        data.setValue("false");
        when(dictDataMapper.selectEnabledByType("status")).thenReturn(List.of(data));

        List<DictDataVo> result = dictCacheService.get("status");

        assertEquals(1, result.size());
        assertEquals("禁用", result.get(0).getLabel());
        verify(redisUtils).set(eq("dict:data:status"), any(DictCacheData.class));
    }

    @Test
    void evictDeletesCacheKey() {
        dictCacheService.evict("status");

        verify(redisUtils).delete("dict:data:status");
    }
}
