package com.sysnest.admin.common.service;

import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.config.properties.AppProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import java.util.UUID;

/**
 * 文件上传服务，相当于 Nest 的 common/services/file.service.ts
 * 命名规则：时间戳-随机数.扩展名，按业务类型分目录
 */
@Service
@RequiredArgsConstructor
public class FileService {

    /** 允许的图片扩展名，头像等场景使用 */
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp", "bmp");

    private final AppProperties appProperties;

    /**
     * 上传文件
     *
     * @param file 上传的文件
     * @param type 业务目录，如 avatar、notice
     * @return 可访问的相对路径，如 /uploads/avatar/1730000000000-123456.png
     */
    public String upload(MultipartFile file, String type) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "上传文件不能为空");
        }

        long maxBytes = appProperties.getUpload().getMaxSize().toBytes();
        if (file.getSize() > maxBytes) {
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    "文件大小不能超过 " + appProperties.getUpload().getMaxSize().toMegabytes() + "MB");
        }

        String originalName = file.getOriginalFilename();
        String extension = getExtension(originalName);
        if (!IMAGE_EXTENSIONS.contains(extension)) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "只允许上传图片文件");
        }

        // 按日期分目录，避免单个目录文件过多
        String dateDir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Path dir = Paths.get(appProperties.getUpload().getPath(), type, dateDir)
                .toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
            String fileName = System.currentTimeMillis() + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 9)
                    + "." + extension;
            file.transferTo(dir.resolve(fileName).toFile());
            return "/uploads/" + type + "/" + dateDir + "/" + fileName;
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "文件保存失败");
        }
    }

    private String getExtension(String fileName) {
        if (!StringUtils.hasText(fileName) || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
