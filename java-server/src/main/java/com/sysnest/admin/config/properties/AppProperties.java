package com.sysnest.admin.config.properties;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.unit.DataSize;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * 自定义配置绑定，把 yml 里的 app.* 转成对象
 * 相当于 Nest 的 ConfigService 读取配置
 */
@Data
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    /** 超级管理员用户名，跳过权限校验 */
    private String admin = "admin";

    private Jwt jwt = new Jwt();
    private Upload upload = new Upload();
    private Redis redis = new Redis();
    private RateLimit rateLimit = new RateLimit();
    private Security security = new Security();
    private Swagger swagger = new Swagger();
    private FileLog fileLog = new FileLog();

    @Data
    public static class Jwt {
        /** 访问 Token 密钥（HS256 要求至少 32 字节） */
        private String secret;
        /** 刷新 Token 密钥，与访问 Token 分开 */
        private String refreshSecret;
        /** 访问 Token 有效期 */
        private Duration accessTokenExpire = Duration.ofHours(2);
        /** 刷新 Token 有效期 */
        private Duration refreshTokenExpire = Duration.ofDays(7);
    }

    @Data
    public static class Upload {
        /** 上传文件保存目录 */
        private String path = "./uploads";
        /** 单文件大小上限 */
        private DataSize maxSize = DataSize.ofMegabytes(10);
    }

    @Data
    public static class Redis {
        /** 所有缓存键的统一前缀，用于和 Nest 端隔离 */
        private String keyPrefix = "java:";
    }

    @Data
    public static class RateLimit {
        /** 是否启用限流 */
        private boolean enabled = true;
        /** 全局总请求数限流 */
        private Rule global = Rule.of(60, 5000);
        /** 单 IP 全局限流 */
        private Rule ip = Rule.of(60, 10000);
        /** 默认维度：已登录按用户 + 接口，未登录按 IP + 接口 */
        private Rule defaultRule = Rule.of(60, 100);

        /**
         * 一条限流规则：窗口秒数 + 窗口内最大次数
         */
        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        public static class Rule {
            private long time = 60;
            private long count = 100;

            public static Rule of(long time, long count) {
                return new Rule(time, count);
            }
        }
    }

    @Data
    public static class Security {
        /** 不需要登录的路径（相对 context-path） */
        private List<String> whitelist = new ArrayList<>();
    }

    @Data
    public static class Swagger {
        private String title = "sys-nest-admin API";
        private String description = "sys-nest-admin 后台管理系统接口文档";
        private String version = "1.0.0";
        /** Swagger 页面展示的基础地址 */
        private String serverUrl = "http://localhost:3100/dev-api";
    }

    @Data
    public static class FileLog {
        /** 日志根目录，与 logback-spring.xml 使用同一配置 */
        private String dir = "./logs";
    }
}
