package com.sysnest.admin.modules.dict.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.modules.dict.dto.FieldGroupQuery;
import com.sysnest.admin.modules.dict.dto.FieldGroupSaveDto;
import com.sysnest.admin.modules.dict.entity.FieldGroup;
import com.sysnest.admin.modules.dict.mapper.FieldGroupMapper;
import com.sysnest.admin.modules.dict.vo.FieldGroupVo;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * 字段分组管理
 */
@Service
@RequiredArgsConstructor
public class FieldGroupService {

    private final FieldGroupMapper fieldGroupMapper;

    public PageResult<FieldGroupVo> page(FieldGroupQuery query) {
        Page<FieldGroup> page = fieldGroupMapper.selectPage(query.toPage(), Wrappers.<FieldGroup>lambdaQuery()
                .like(StringUtils.hasText(query.getName()), FieldGroup::getName, query.getName())
                .eq(StringUtils.hasText(query.getStatus()), FieldGroup::getStatus, query.getStatus())
                .orderByAsc(FieldGroup::getSort));
        return PageResult.of(page.getRecords().stream().map(this::toVo).toList(),
                page.getTotal(), page.getCurrent(), page.getSize());
    }

    public List<FieldGroupVo> all() {
        return fieldGroupMapper.selectList(Wrappers.<FieldGroup>lambdaQuery()
                        .eq(FieldGroup::getStatus, "1")
                        .orderByAsc(FieldGroup::getSort))
                .stream().map(this::toVo).toList();
    }

    public FieldGroupVo detail(Integer id) {
        FieldGroup group = fieldGroupMapper.selectById(id);
        return group == null ? null : toVo(group);
    }

    public void create(FieldGroupSaveDto dto) {
        if (!StringUtils.hasText(dto.getName()) || !StringUtils.hasText(dto.getCode())) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "分组名称和编码不能为空");
        }
        if (fieldGroupMapper.selectCount(Wrappers.<FieldGroup>lambdaQuery()
                .eq(FieldGroup::getCode, dto.getCode())) > 0) {
            throw new BusinessException(ErrorCode.DICT_GROUP_ALREADY_EXISTS, "分组编码已存在");
        }
        FieldGroup group = new FieldGroup();
        group.setName(dto.getName());
        group.setCode(dto.getCode());
        group.setSort(dto.getSort() == null ? 0 : dto.getSort());
        group.setStatus(StringUtils.hasText(dto.getStatus()) ? dto.getStatus() : "1");
        group.setRemark(dto.getRemark());
        fieldGroupMapper.insert(group);
    }

    public void update(Integer id, FieldGroupSaveDto dto) {
        FieldGroup group = fieldGroupMapper.selectById(id);
        if (group == null) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "字段分组不存在");
        }
        if (StringUtils.hasText(dto.getCode()) && !dto.getCode().equals(group.getCode())
                && fieldGroupMapper.selectCount(Wrappers.<FieldGroup>lambdaQuery()
                .eq(FieldGroup::getCode, dto.getCode())
                .ne(FieldGroup::getId, id)) > 0) {
            throw new BusinessException(ErrorCode.DICT_GROUP_ALREADY_EXISTS, "分组编码已存在");
        }
        if (dto.getName() != null) {
            group.setName(dto.getName());
        }
        if (dto.getCode() != null) {
            group.setCode(dto.getCode());
        }
        if (dto.getSort() != null) {
            group.setSort(dto.getSort());
        }
        if (dto.getStatus() != null) {
            group.setStatus(dto.getStatus());
        }
        if (dto.getRemark() != null) {
            group.setRemark(dto.getRemark());
        }
        fieldGroupMapper.updateById(group);
    }

    public void delete(Integer id) {
        fieldGroupMapper.deleteById(id);
    }

    public void batchDelete(List<Integer> ids) {
        ids.forEach(fieldGroupMapper::deleteById);
    }

    private FieldGroupVo toVo(FieldGroup group) {
        FieldGroupVo vo = new FieldGroupVo();
        BeanUtils.copyProperties(group, vo);
        return vo;
    }
}
