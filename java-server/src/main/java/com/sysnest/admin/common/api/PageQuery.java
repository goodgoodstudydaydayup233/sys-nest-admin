package com.sysnest.admin.common.api;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.io.Serializable;

/**
 * 分页查询入参，相当于 Nest 的 pagination.dto.ts
 */
@Data
public class PageQuery implements Serializable {

    /** 页码，从 1 开始 */
    @Min(value = 1, message = "页码最小为 1")
    private long page = 1;

    /** 每页条数，默认 10，最大 500 */
    @Min(value = 1, message = "每页条数最小为 1")
    @Max(value = 500, message = "每页条数不能超过 500")
    private long pageSize = 10;

    /**
     * 转成 MyBatis-Plus 的分页对象，顺带把非法值兜住
     */
    public <T> Page<T> toPage() {
        long current = page < 1 ? 1 : page;
        long size = pageSize < 1 ? 10 : Math.min(pageSize, 500);
        return new Page<>(current, size);
    }
}
