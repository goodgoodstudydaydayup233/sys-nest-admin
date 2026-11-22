package com.sysnest.admin.modules.captcha.controller;

import com.sysnest.admin.common.annotation.RateLimit;
import com.sysnest.admin.common.api.Result;
import com.sysnest.admin.modules.captcha.service.CaptchaService;
import com.sysnest.admin.modules.captcha.vo.CaptchaVo;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 验证码接口
 */
@RestController
@RequestMapping("/captcha")
@RequiredArgsConstructor
@Tag(name = "验证码")
public class CaptchaController {

    private final CaptchaService captchaService;

    /**
     * 获取验证码；系统配置关闭时返回 data = null
     */
    @GetMapping
    @Operation(summary = "获取图形验证码")
    @RateLimit(time = 60, count = 10, dimension = RateLimit.Dimension.IP)
    public Result<CaptchaVo> captcha() {
        return Result.ok(captchaService.generate());
    }
}
