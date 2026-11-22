package com.sysnest.admin.modules.dict.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.dict.dto.DictDataQuery;
import com.sysnest.admin.modules.dict.dto.DictDataSaveDto;
import com.sysnest.admin.modules.dict.entity.DictData;
import com.sysnest.admin.modules.dict.entity.DictType;
import com.sysnest.admin.modules.dict.mapper.DictDataMapper;
import com.sysnest.admin.modules.dict.mapper.DictTypeMapper;
import com.sysnest.admin.modules.dict.vo.DictDataVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 字典数据管理
 */
@Service
@RequiredArgsConstructor
public class DictDataService {

    private final DictDataMapper dictDataMapper;
    private final DictTypeMapper dictTypeMapper;
    private final DictCacheService dictCacheService;

    public PageResult<DictDataVo> page(DictDataQuery query) {
        List<Integer> typeIds = null;
        if (StringUtils.hasText(query.getDictType())) {
            typeIds = dictTypeMapper.selectList(Wrappers.<DictType>lambdaQuery()
                            .eq(DictType::getType, query.getDictType()))
                    .stream().map(DictType::getId).toList();
            if (typeIds.isEmpty()) {
                return PageResult.of(List.of(), 0, query.getPage(), query.getPageSize());
            }
        }

        Page<DictData> page = dictDataMapper.selectPage(query.toPage(), Wrappers.<DictData>lambdaQuery()
                .like(StringUtils.hasText(query.getLabel()), DictData::getLabel, query.getLabel())
                .eq(query.getTypeId() != null, DictData::getTypeId, query.getTypeId())
                .in(typeIds != null, DictData::getTypeId, typeIds)
                .eq(StringUtils.hasText(query.getStatus()), DictData::getStatus, query.getStatus())
                .orderByAsc(DictData::getSort));

        return PageResult.of(page.getRecords().stream().map(this::toVo).toList(),
                page.getTotal(), page.getCurrent(), page.getSize());
    }

    /**
     * 按类型取启用数据，走缓存
     */
    public List<DictDataVo> byType(String dictType) {
        return dictCacheService.get(dictType);
    }

    public DictDataVo detail(Integer id) {
        DictData data = dictDataMapper.selectById(id);
        return data == null ? null : toVo(data);
    }

    public void create(DictDataSaveDto dto) {
        if (!StringUtils.hasText(dto.getLabel())
                || !StringUtils.hasText(dto.getValue())
                || dto.getTypeId() == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "标签、值和字典类型不能为空");
        }
        if (dictTypeMapper.selectById(dto.getTypeId()) == null) {
            throw new BusinessException(ErrorCode.DICT_TYPE_NOT_FOUND);
        }

        DictData data = new DictData();
        data.setLabel(dto.getLabel());
        data.setValue(dto.getValue());
        data.setTypeId(dto.getTypeId());
        data.setCssClass(dto.getCssClass());
        data.setListClass(dto.getListClass());
        data.setSort(dto.getSort() == null ? 0 : dto.getSort());
        data.setStatus(StringUtils.hasText(dto.getStatus()) ? dto.getStatus() : "1");
        data.setRemark(dto.getRemark());
        dictDataMapper.insert(data);

        evictType(data.getTypeId());
    }

    public void update(Integer id, DictDataSaveDto dto) {
        DictData data = dictDataMapper.selectById(id);
        if (data == null) {
            throw new BusinessException(ErrorCode.DICT_DATA_NOT_FOUND);
        }
        Integer oldTypeId = data.getTypeId();

        if (dto.getLabel() != null) {
            data.setLabel(dto.getLabel());
        }
        if (dto.getValue() != null) {
            data.setValue(dto.getValue());
        }
        if (dto.getTypeId() != null) {
            data.setTypeId(dto.getTypeId());
        }
        if (dto.getCssClass() != null) {
            data.setCssClass(dto.getCssClass());
        }
        if (dto.getListClass() != null) {
            data.setListClass(dto.getListClass());
        }
        if (dto.getSort() != null) {
            data.setSort(dto.getSort());
        }
        if (dto.getStatus() != null) {
            data.setStatus(dto.getStatus());
        }
        if (dto.getRemark() != null) {
            data.setRemark(dto.getRemark());
        }
        dictDataMapper.updateById(data);

        evictType(oldTypeId);
        if (!oldTypeId.equals(data.getTypeId())) {
            evictType(data.getTypeId());
        }
    }

    public void delete(Integer id) {
        DictData data = dictDataMapper.selectById(id);
        if (data == null) {
            return;
        }
        dictDataMapper.deleteById(id);
        evictType(data.getTypeId());
    }

    public void batchDelete(List<Integer> ids) {
        ids.forEach(this::delete);
    }

    private void evictType(Integer typeId) {
        DictType type = dictTypeMapper.selectById(typeId);
        if (type != null) {
            dictCacheService.evict(type.getType());
        }
    }

    private DictDataVo toVo(DictData data) {
        DictDataVo vo = new DictDataVo();
        BeanUtils.copyProperties(data, vo);
        return vo;
    }
}
