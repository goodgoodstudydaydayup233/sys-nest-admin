package com.sysnest.admin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * 程序入口，相当于 Nest 的 main.ts + app.module.ts
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
@ConfigurationPropertiesScan
@MapperScan("com.sysnest.admin.modules.**.mapper")
public class SysNestAdminApplication {

    public static void main(String[] args) {
        SpringApplication.run(SysNestAdminApplication.class, args);
    }
}
