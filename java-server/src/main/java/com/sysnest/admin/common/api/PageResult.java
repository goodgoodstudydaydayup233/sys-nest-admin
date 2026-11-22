package com.sysnest.admin.common.api;

import com.baomidou.mybatisplus.core.metadata.IPage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 分页返回结构，相当于 Nest 的 PaginationVo
 * 字段与 Nest 端完全对齐：{ list, total, page, pageSize }
 *
 * @param <T> 列表元素类型
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResult<T> implements Serializable {

    /** 当前页数据 */
    private List<T> list;

    /** 总条数 */
    private long total;

    /** 当前页码 */
    private long page;

    /** 每页条数 */
    private long pageSize;

    /**
     * 从 MyBatis-Plus 的分页对象转换，页码和每页条数直接取自分页结果
     */
    public static <T> PageResult<T> of(IPage<T> page) {
        return new PageResult<>(page.getRecords(), page.getTotal(), page.getCurrent(), page.getSize());
    }

    public static <T> PageResult<T> of(List<T> list, long total, long page, long pageSize) {
        return new PageResult<>(list, total, page, pageSize);
    }
}
