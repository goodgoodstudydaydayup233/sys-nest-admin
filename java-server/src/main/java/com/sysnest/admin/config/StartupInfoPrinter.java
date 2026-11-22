package com.sysnest.admin.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * 启动完成后打印访问地址，格式与 Nest 端保持一致
 * 用 ApplicationReadyEvent 是为了让这段信息出现在 “Started ...” 之后，成为终端最后几行
 */
@Component
@RequiredArgsConstructor
public class StartupInfoPrinter {

    private final Environment environment;

    @EventListener(ApplicationReadyEvent.class)
    public void print() {
        String port = environment.getProperty("local.server.port",
                environment.getProperty("server.port", "3100"));
        String contextPath = environment.getProperty("server.servlet.context-path", "");
        String swaggerPath = environment.getProperty("springdoc.swagger-ui.path", "/swagger-ui.html");
        String apiDocsPath = environment.getProperty("springdoc.api-docs.path", "/v3/api-docs");

        String baseUrl = "http://localhost:" + port;
        String prefix = contextPath.isBlank() ? "/" : contextPath;

        System.out.println();
        System.out.println("Application is running on: " + baseUrl);
        System.out.println("API prefix: " + prefix);
        System.out.println("Swagger API docs: " + baseUrl + contextPath + swaggerPath);
        System.out.println("Swagger JSON (for Apifox import): " + baseUrl + contextPath + apiDocsPath);
        System.out.flush();
    }
}
