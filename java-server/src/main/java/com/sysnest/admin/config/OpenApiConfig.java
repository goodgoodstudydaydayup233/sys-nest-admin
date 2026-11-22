package com.sysnest.admin.config;

import com.sysnest.admin.config.properties.AppProperties;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * 接口文档配置，相当于 Nest main.ts 里的 SwaggerModule
 * 页面地址：http://localhost:3100/dev-api/swagger-ui.html
 */
@Configuration
@RequiredArgsConstructor
public class OpenApiConfig {

    private final AppProperties appProperties;

    @Bean
    public OpenAPI openAPI() {
        String schemeName = "Bearer";
        return new OpenAPI()
                .info(new Info()
                        .title(appProperties.getSwagger().getTitle())
                        .description(appProperties.getSwagger().getDescription())
                        .version(appProperties.getSwagger().getVersion()))
                .servers(List.of(new Server().url(appProperties.getSwagger().getServerUrl())))
                .tags(List.of(
                        new Tag().name("认证").description("登录、刷新 Token、登出与动态路由"),
                        new Tag().name("验证码").description("图形验证码生成"),
                        new Tag().name("用户管理").description("用户维护与个人中心"),
                        new Tag().name("角色管理").description("角色维护与菜单权限绑定"),
                        new Tag().name("菜单管理").description("目录、菜单、按钮维护"),
                        new Tag().name("字段分组").description("字典字段分组维护"),
                        new Tag().name("字典类型").description("字典类型与缓存刷新"),
                        new Tag().name("字典数据").description("字典数据维护"),
                        new Tag().name("参数配置").description("系统参数与缓存刷新")))
                .addSecurityItem(new SecurityRequirement().addList(schemeName))
                .components(new Components().addSecuritySchemes(schemeName,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
