package com.sysnest.admin.modules.dict.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 字典缓存包装对象
 * Redis 直接存 List 时根节点会缺少 Jackson 类型信息，包一层对象即可稳定反序列化
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DictCacheData implements Serializable {

    private List<DictDataVo> list;
}
