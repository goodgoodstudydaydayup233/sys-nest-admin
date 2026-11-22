package com.sysnest.admin.modules.captcha.service;

import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.util.RedisUtils;
import com.sysnest.admin.modules.captcha.vo.CaptchaVo;
import com.sysnest.admin.modules.config.service.SysConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Locale;

/**
 * 图形验证码，对应 Nest 的 captcha.service.ts
 * 生成 SVG（前端可直接 v-html），Redis 存小写答案，300 秒过期，校验后立即删除
 */
@Service
@RequiredArgsConstructor
public class CaptchaService {

    private static final String CONFIG_KEY = "sys.login.captchaEnabled";
    private static final String CACHE_PREFIX = "captcha:";
    private static final Duration TTL = Duration.ofSeconds(300);
    /** 去掉容易混淆的 0/o/1/i */
    private static final String CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int CODE_LENGTH = 4;

    private final RedisUtils redisUtils;
    private final SysConfigService sysConfigService;
    private final SecureRandom random = new SecureRandom();

    /**
     * 验证码是否启用：只有配置值严格等于 false 才关闭
     */
    public boolean isEnabled() {
        return !"false".equalsIgnoreCase(sysConfigService.getValue(CONFIG_KEY));
    }

    /**
     * 生成验证码，关闭时返回 null
     */
    public CaptchaVo generate() {
        if (!isEnabled()) {
            return null;
        }

        String code = randomCode();
        String key = Long.toString(System.currentTimeMillis(), 36) + randomText(8);
        redisUtils.set(CACHE_PREFIX + key, code.toLowerCase(Locale.ROOT), TTL);
        return new CaptchaVo(key, buildSvg(code));
    }

    /**
     * 一次性校验：无论成功失败，取出后立即删除
     */
    public void verify(String key, String input) {
        if (!StringUtils.hasText(key) || !StringUtils.hasText(input)) {
            throw new BusinessException(ErrorCode.CAPTCHA_ERROR);
        }

        Object cached = redisUtils.get(CACHE_PREFIX + key);
        redisUtils.delete(CACHE_PREFIX + key);

        if (cached == null) {
            throw new BusinessException(ErrorCode.CAPTCHA_ERROR);
        }
        if (!String.valueOf(cached).equalsIgnoreCase(input.trim())) {
            throw new BusinessException(ErrorCode.CAPTCHA_ERROR);
        }
    }

    private String randomCode() {
        StringBuilder builder = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            builder.append(CHARS.charAt(random.nextInt(CHARS.length())));
        }
        return builder.toString();
    }

    private String randomText(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder builder = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            builder.append(chars.charAt(random.nextInt(chars.length())));
        }
        return builder.toString();
    }

    /**
     * 拼一个带干扰线和随机颜色的 SVG 验证码
     */
    private String buildSvg(String code) {
        StringBuilder svg = new StringBuilder();
        svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"120\" height=\"40\" viewBox=\"0 0 120 40\">");
        svg.append("<rect width=\"100%\" height=\"100%\" fill=\"#f5f5f5\"/>");

        // 3 条干扰线
        for (int i = 0; i < 3; i++) {
            svg.append("<line x1=\"").append(random.nextInt(120))
                    .append("\" y1=\"").append(random.nextInt(40))
                    .append("\" x2=\"").append(random.nextInt(120))
                    .append("\" y2=\"").append(random.nextInt(40))
                    .append("\" stroke=\"").append(randomColor())
                    .append("\" stroke-width=\"1\"/>");
        }

        // 噪点
        for (int i = 0; i < 12; i++) {
            svg.append("<circle cx=\"").append(random.nextInt(120))
                    .append("\" cy=\"").append(random.nextInt(40))
                    .append("\" r=\"1\" fill=\"").append(randomColor()).append("\"/>");
        }

        // 每个字符随机颜色和轻微旋转
        for (int i = 0; i < code.length(); i++) {
            int x = 12 + i * 26;
            int rotate = random.nextInt(41) - 20;
            svg.append("<text x=\"").append(x)
                    .append("\" y=\"28\" font-size=\"26\" font-family=\"Arial, sans-serif\" font-weight=\"bold\" fill=\"")
                    .append(randomColor())
                    .append("\" transform=\"rotate(").append(rotate).append(" ").append(x).append(" 28)\">")
                    .append(code.charAt(i))
                    .append("</text>");
        }
        svg.append("</svg>");
        return svg.toString();
    }

    private String randomColor() {
        return String.format("#%02x%02x%02x",
                random.nextInt(120) + 60,
                random.nextInt(120) + 60,
                random.nextInt(120) + 60);
    }
}
