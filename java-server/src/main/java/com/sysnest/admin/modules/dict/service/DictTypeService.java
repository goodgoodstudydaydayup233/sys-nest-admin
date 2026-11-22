package com.sysnest.admin.modules.dict.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.dict.dto.DictTypeQuery;
import com.sysnest.admin.modules.dict.dto.DictTypeSaveDto;
import com.sysnest.admin.modules.dict.entity.DictData;
import com.sysnest.admin.modules.dict.entity.DictType;
import com.sysnest.admin.modules.dict.entity.FieldGroup;
import com.sysnest.admin.modules.dict.mapper.DictDataMapper;
import com.sysnest.admin.modules.dict.mapper.DictTypeMapper;
import com.sysnest.admin.modules.dict.mapper.FieldGroupMapper;
import com.sysnest.admin.modules.dict.vo.DictTypeVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 字典类型管理
 */
@Service
@RequiredArgsConstructor
public class DictTypeService {

    private final DictTypeMapper dictTypeMapper;
    private final DictDataMapper dictDataMapper;
    private final FieldGroupMapper fieldGroupMapper;
    private final DictCacheService dictCacheService;

    public PageResult<DictTypeVo> page(DictTypeQuery query) {
        Page<DictType> page = dictTypeMapper.selectPage(query.toPage(), Wrappers.<DictType>lambdaQuery()
                .like(StringUtils.hasText(query.getName()), DictType::getName, query.getName())
                .like(StringUtils.hasText(query.getType()), DictType::getType, query.getType())
                .eq(query.getGroupId() != null, DictType::getGroupId, query.getGroupId())
                .eq(StringUtils.hasText(query.getStatus()), DictType::getStatus, query.getStatus())
                .orderByAsc(DictType::getSort));

        List<DictTypeVo> list = page.getRecords().stream().map(this::toVo).toList();
        fillGroupNames(page.getRecords(), list);
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    public DictTypeVo detail(Integer id) {
        DictType type = dictTypeMapper.selectById(id);
        if (type == null) {
            return null;
        }
        DictTypeVo vo = toVo(type);
        fillGroupNames(List.of(type), List.of(vo));
        return vo;
    }

    public void create(DictTypeSaveDto dto) {
        if (!StringUtils.hasText(dto.getName()) || !StringUtils.hasText(dto.getType())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "字典名称和类型不能为空");
        }
        if (existsType(dto.getType(), null)) {
            throw new BusinessException(ErrorCode.DICT_TYPE_ALREADY_EXISTS, "字典类型已存在");
        }
        DictType type = new DictType();
        type.setName(dto.getName());
        type.setType(dto.getType());
        type.setGroupId(dto.getGroupId());
        type.setSort(dto.getSort() == null ? 0 : dto.getSort());
        type.setStatus(StringUtils.hasText(dto.getStatus()) ? dto.getStatus() : "1");
        type.setRemark(dto.getRemark());
        dictTypeMapper.insert(type);
    }

    public void update(Integer id, DictTypeSaveDto dto) {
        DictType type = dictTypeMapper.selectById(id);
        if (type == null) {
            throw new BusinessException(ErrorCode.DICT_TYPE_NOT_FOUND);
        }
        String oldType = type.getType();
        if (StringUtils.hasText(dto.getType()) && !dto.getType().equals(oldType)
                && existsType(dto.getType(), id)) {
            throw new BusinessException(ErrorCode.DICT_TYPE_ALREADY_EXISTS, "字典类型已存在");
        }

        if (dto.getName() != null) {
            type.setName(dto.getName());
        }
        if (dto.getType() != null) {
            type.setType(dto.getType());
        }
        if (dto.getGroupId() != null) {
            type.setGroupId(dto.getGroupId());
        }
        if (dto.getSort() != null) {
            type.setSort(dto.getSort());
        }
        if (dto.getStatus() != null) {
            type.setStatus(dto.getStatus());
        }
        if (dto.getRemark() != null) {
            type.setRemark(dto.getRemark());
        }
        dictTypeMapper.updateById(type);

        dictCacheService.evict(oldType);
        if (!oldType.equals(type.getType())) {
            dictCacheService.evict(type.getType());
        }
    }

    /**
     * 删除字典类型：存在字典数据时禁止删除
     */
    public void delete(Integer id) {
        DictType type = dictTypeMapper.selectById(id);
        if (type == null) {
            return;
        }
        long dataCount = dictDataMapper.selectCount(
                Wrappers.<DictData>lambdaQuery().eq(DictData::getTypeId, id));
        if (dataCount > 0) {
            throw new BusinessException(ErrorCode.DICT_TYPE_IN_USE);
        }
        dictTypeMapper.deleteById(id);
        dictCacheService.evict(type.getType());
    }

    public void batchDelete(List<Integer> ids) {
        ids.forEach(this::delete);
    }

    /**
     * 刷新字典缓存，返回重新预热的类型数量
     */
    public int refresh() {
        return dictCacheService.refreshAll();
    }

    private boolean existsType(String value, Integer excludeId) {
        return dictTypeMapper.selectCount(Wrappers.<DictType>lambdaQuery()
                .eq(DictType::getType, value)
                .ne(excludeId != null, DictType::getId, excludeId)) > 0;
    }

    private DictTypeVo toVo(DictType type) {
        DictTypeVo vo = new DictTypeVo();
        BeanUtils.copyProperties(type, vo);
        return vo;
    }

    /**
     * 批量补充分组名称，避免每个类型单独查一次
     */
    private void fillGroupNames(List<DictType> types, List<DictTypeVo> vos) {
        List<Integer> groupIds = types.stream()
                .map(DictType::getGroupId)
                .filter(id -> id != null)
                .distinct()
                .toList();
        if (groupIds.isEmpty()) {
            return;
        }
        Map<Integer, FieldGroup> groups = fieldGroupMapper.selectBatchIds(groupIds).stream()
                .collect(Collectors.toMap(FieldGroup::getId, Function.identity()));
        for (DictTypeVo vo : vos) {
            FieldGroup group = groups.get(vo.getGroupId());
            if (group != null) {
                vo.setGroupName(group.getName());
            }
        }
    }
}
