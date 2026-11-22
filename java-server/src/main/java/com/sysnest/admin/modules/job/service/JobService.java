package com.sysnest.admin.modules.job.service;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sysnest.admin.common.api.PageResult;
import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.schedule.DynamicTaskScheduler;
import com.sysnest.admin.modules.job.dto.JobQuery;
import com.sysnest.admin.modules.job.dto.JobSaveDto;
import com.sysnest.admin.modules.job.entity.SysJob;
import com.sysnest.admin.modules.job.entity.SysJobLog;
import com.sysnest.admin.modules.job.mapper.SysJobLogMapper;
import com.sysnest.admin.modules.job.mapper.SysJobMapper;
import com.sysnest.admin.modules.job.vo.JobVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.BeansException;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 定时任务服务，对应 Nest 的 job.service.ts
 *
 * 核心能力：
 * - CRUD + 动态注册/取消调度
 * - 应用启动时加载所有状态正常的任务
 * - 调用目标按 beanName.method(args) 反射执行
 * - 禁止并发策略、misfire 策略、执行日志落库
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JobService implements ApplicationRunner {

    /** 调用目标格式：beanName.method(arg1, arg2) */
    private static final Pattern INVOKE_TARGET_PATTERN =
            Pattern.compile("^(\\w+)\\.(\\w+)\\((.*)\\)$");

    private final SysJobMapper sysJobMapper;
    private final SysJobLogMapper sysJobLogMapper;
    private final DynamicTaskScheduler dynamicTaskScheduler;
    private final ApplicationContext applicationContext;

    /** 正在执行的任务 ID，用于“禁止并发”策略 */
    private final Set<Integer> runningJobs = ConcurrentHashMap.newKeySet();

    /**
     * 应用启动后加载所有状态正常的任务，与 Nest 的 OnModuleInit 一致
     */
    @Override
    public void run(ApplicationArguments args) {
        try {
            List<SysJob> jobs = sysJobMapper.selectList(
                    Wrappers.<SysJob>lambdaQuery().eq(SysJob::getStatus, "0"));
            jobs.forEach(this::scheduleJob);
            log.info("定时任务调度器初始化完成，共加载 {} 个任务", jobs.size());
        } catch (Exception e) {
            log.error("定时任务调度器初始化失败：{}", e.getMessage());
        }
    }

    public PageResult<JobVo> page(JobQuery query) {
        Page<SysJob> page = sysJobMapper.selectPage(query.toPage(), Wrappers.<SysJob>lambdaQuery()
                .like(StringUtils.hasText(query.getJobName()), SysJob::getJobName, query.getJobName())
                .eq(StringUtils.hasText(query.getJobGroup()), SysJob::getJobGroup, query.getJobGroup())
                .eq(StringUtils.hasText(query.getStatus()), SysJob::getStatus, query.getStatus())
                .orderByAsc(SysJob::getId));

        List<JobVo> list = page.getRecords().stream().map(this::toVo).toList();
        return PageResult.of(list, page.getTotal(), page.getCurrent(), page.getSize());
    }

    public JobVo detail(Integer id) {
        SysJob job = sysJobMapper.selectById(id);
        return job == null ? null : toVo(job);
    }

    public JobVo create(JobSaveDto dto) {
        if (!StringUtils.hasText(dto.getJobName())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "任务名称不能为空");
        }
        if (!StringUtils.hasText(dto.getInvokeTarget())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "调用目标字符串不能为空");
        }
        if (!StringUtils.hasText(dto.getCronExpression())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "cron执行表达式不能为空");
        }
        String cron = normalizeCron(dto.getCronExpression());
        if (!isValidCron(cron)) {
            throw new BusinessException(ErrorCode.JOB_CRON_INVALID);
        }
        validateInvokeTarget(dto.getInvokeTarget());

        String status = StringUtils.hasText(dto.getStatus()) ? dto.getStatus() : "0";
        SysJob job = new SysJob();
        job.setJobName(dto.getJobName());
        job.setJobGroup(StringUtils.hasText(dto.getJobGroup()) ? dto.getJobGroup() : "DEFAULT");
        job.setInvokeTarget(dto.getInvokeTarget());
        job.setCronExpression(cron);
        job.setMisfirePolicy(StringUtils.hasText(dto.getMisfirePolicy()) ? dto.getMisfirePolicy() : "3");
        job.setConcurrent(StringUtils.hasText(dto.getConcurrent()) ? dto.getConcurrent() : "1");
        job.setStatus(status);
        job.setNextValidTime("0".equals(status) ? nextValidTime(cron) : null);
        job.setRemark(dto.getRemark());

        sysJobMapper.insert(job);
        if ("0".equals(status)) {
            scheduleJob(job);
        }
        return toVo(job);
    }

    public JobVo update(Integer id, JobSaveDto dto) {
        SysJob job = requireJob(id);

        if (dto.getCronExpression() != null) {
            String cron = normalizeCron(dto.getCronExpression());
            if (!isValidCron(cron)) {
                throw new BusinessException(ErrorCode.JOB_CRON_INVALID);
            }
            job.setCronExpression(cron);
        }
        if (dto.getInvokeTarget() != null) {
            validateInvokeTarget(dto.getInvokeTarget());
            job.setInvokeTarget(dto.getInvokeTarget());
        }
        if (dto.getJobName() != null) {
            job.setJobName(dto.getJobName());
        }
        if (dto.getJobGroup() != null) {
            job.setJobGroup(dto.getJobGroup());
        }
        if (dto.getMisfirePolicy() != null) {
            job.setMisfirePolicy(dto.getMisfirePolicy());
        }
        if (dto.getConcurrent() != null) {
            job.setConcurrent(dto.getConcurrent());
        }
        if (dto.getStatus() != null) {
            job.setStatus(dto.getStatus());
        }
        if (dto.getRemark() != null) {
            job.setRemark(dto.getRemark());
        }

        job.setNextValidTime("0".equals(job.getStatus()) ? nextValidTime(job.getCronExpression()) : null);
        sysJobMapper.updateById(job);

        // 修改后按最新配置重新注册；暂停则移除调度
        if ("0".equals(job.getStatus())) {
            scheduleJob(job);
        } else {
            dynamicTaskScheduler.cancel(id);
        }
        return detail(id);
    }

    public void changeStatus(Integer id, String status) {
        SysJob job = requireJob(id);
        job.setStatus(status);
        job.setNextValidTime("0".equals(status) ? nextValidTime(job.getCronExpression()) : null);
        sysJobMapper.updateById(job);

        if ("0".equals(status)) {
            scheduleJob(job);
        } else {
            dynamicTaskScheduler.cancel(id);
        }
    }

    /**
     * 立即执行一次，不改变原有调度
     */
    public void run(Integer id) {
        SysJob job = requireJob(id);
        executeJob(job, true);
    }

    public void remove(Integer id) {
        requireJob(id);
        dynamicTaskScheduler.cancel(id);
        sysJobMapper.deleteById(id);
    }

    public void batchRemove(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return;
        }
        for (Integer id : ids) {
            remove(id);
        }
    }

    // ==================== 调度内部逻辑 ====================

    /**
     * 注册任务到动态调度器，并处理 misfirePolicy：
     * 1-立即执行一次；2-执行一次后停止；3-按 cron 正常调度
     */
    private void scheduleJob(SysJob job) {
        if (job == null || !"0".equals(job.getStatus())) {
            return;
        }
        if (!isValidCron(job.getCronExpression())) {
            log.warn("任务[{}]cron 表达式不合法，跳过注册", job.getJobName());
            return;
        }

        Runnable onTick = () -> executeJob(job, false);
        dynamicTaskScheduler.schedule(job.getId(), normalizeCron(job.getCronExpression()), onTick);

        if ("1".equals(job.getMisfirePolicy())) {
            dynamicTaskScheduler.runOnce(onTick);
        } else if ("2".equals(job.getMisfirePolicy())) {
            onTick.run();
            dynamicTaskScheduler.cancel(job.getId());
        }
    }

    /**
     * 执行任务并写调度日志；异常不向外抛，保证调度线程继续运行
     */
    private void executeJob(SysJob job, boolean manual) {
        // 禁止并发：定时触发时如果上一次还没跑完就跳过；手动执行不受限制
        boolean added = runningJobs.add(job.getId());
        if (!manual && "1".equals(job.getConcurrent()) && !added) {
            log.warn("任务[{}]正在执行，跳过本次触发", job.getJobName());
            return;
        }
        if (!added) {
            runningJobs.add(job.getId());
        }

        String status = "0";
        String jobMessage;
        String exceptionInfo = null;
        try {
            jobMessage = invokeMethod(job.getInvokeTarget());
        } catch (Exception e) {
            status = "1";
            jobMessage = "执行失败";
            exceptionInfo = stackTrace(e);
            log.error("任务[{}]执行失败：{}", job.getJobName(), exceptionInfo);
        } finally {
            runningJobs.remove(job.getId());
        }

        SysJobLog jobLog = new SysJobLog();
        jobLog.setJobName(job.getJobName());
        jobLog.setJobGroup(job.getJobGroup());
        jobLog.setInvokeTarget(job.getInvokeTarget());
        jobLog.setJobMessage(manual ? "手动触发：" + jobMessage : jobMessage);
        jobLog.setStatus(status);
        jobLog.setExceptionInfo(exceptionInfo);
        jobLog.setCreateTime(LocalDateTime.now());
        sysJobLogMapper.insert(jobLog);
    }

    /**
     * 解析并调用目标方法，例如 stTask.stParams('st')
     */
    private String invokeMethod(String invokeTarget) {
        Matcher matcher = INVOKE_TARGET_PATTERN.matcher(invokeTarget == null ? "" : invokeTarget.trim());
        if (!matcher.matches()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "调用目标字符串格式错误，应为 beanName.method(args)");
        }
        String beanName = matcher.group(1);
        String methodName = matcher.group(2);
        List<Object> args = parseArgs(matcher.group(3));

        Object bean;
        try {
            bean = applicationContext.getBean(beanName);
        } catch (BeansException e) {
            throw new BusinessException(ErrorCode.JOB_BEAN_NOT_FOUND);
        }

        Method method = findMethod(bean.getClass(), methodName, args);
        if (method == null) {
            throw new BusinessException(ErrorCode.JOB_METHOD_NOT_FOUND);
        }

        Object[] convertedArgs = new Object[method.getParameterCount()];
        Class<?>[] parameterTypes = method.getParameterTypes();
        for (int i = 0; i < parameterTypes.length; i++) {
            convertedArgs[i] = convertArg(args.get(i), parameterTypes[i]);
        }

        try {
            Object result = method.invoke(bean, convertedArgs);
            return result == null ? "执行成功" : String.valueOf(result);
        } catch (InvocationTargetException e) {
            Throwable target = e.getTargetException();
            throw new BusinessException(ErrorCode.PARAM_ERROR,
                    target.getMessage() == null ? target.getClass().getSimpleName() : target.getMessage());
        } catch (ReflectiveOperationException e) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, e.getMessage());
        }
    }

    /**
     * 找出方法名和参数个数都匹配的方法，并确认参数可转换
     */
    private Method findMethod(Class<?> beanClass, String methodName, List<Object> args) {
        for (Method method : beanClass.getMethods()) {
            if (!method.getName().equals(methodName) || method.getParameterCount() != args.size()) {
                continue;
            }
            boolean convertible = true;
            Class<?>[] types = method.getParameterTypes();
            for (int i = 0; i < types.length; i++) {
                if (!canConvert(args.get(i), types[i])) {
                    convertible = false;
                    break;
                }
            }
            if (convertible) {
                return method;
            }
        }
        return null;
    }

    private boolean canConvert(Object arg, Class<?> type) {
        if (arg == null || type.isInstance(arg)) {
            return true;
        }
        if (type == String.class) {
            return true;
        }
        String text = String.valueOf(arg);
        try {
            if (type == int.class || type == Integer.class) {
                Integer.parseInt(text);
            } else if (type == long.class || type == Long.class) {
                Long.parseLong(text);
            } else if (type == double.class || type == Double.class) {
                Double.parseDouble(text);
            } else if (type == float.class || type == Float.class) {
                Float.parseFloat(text);
            } else if (type == boolean.class || type == Boolean.class) {
                Boolean.parseBoolean(text);
            } else {
                return false;
            }
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private Object convertArg(Object arg, Class<?> type) {
        if (arg == null || type.isInstance(arg)) {
            return arg;
        }
        String text = String.valueOf(arg);
        if (type == String.class) {
            return text;
        }
        if (type == int.class || type == Integer.class) {
            return Integer.valueOf(text);
        }
        if (type == long.class || type == Long.class) {
            return Long.valueOf(text);
        }
        if (type == double.class || type == Double.class) {
            return Double.valueOf(text);
        }
        if (type == float.class || type == Float.class) {
            return Float.valueOf(text);
        }
        if (type == boolean.class || type == Boolean.class) {
            return Boolean.valueOf(text);
        }
        throw new BusinessException(ErrorCode.PARAM_ERROR, "不支持的参数类型：" + type.getName());
    }

    /**
     * 解析参数字符串，支持字符串、整数、小数、布尔值
     * 例如：'st', 1, true
     */
    private List<Object> parseArgs(String argsStr) {
        List<Object> args = new ArrayList<>();
        if (argsStr == null || argsStr.isBlank()) {
            return args;
        }

        List<String> tokens = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        char quote = 0;
        for (char c : argsStr.toCharArray()) {
            if (quote != 0) {
                current.append(c);
                if (c == quote) {
                    quote = 0;
                }
            } else if (c == '\'' || c == '"') {
                quote = c;
                current.append(c);
            } else if (c == ',') {
                tokens.add(current.toString());
                current.setLength(0);
            } else {
                current.append(c);
            }
        }
        tokens.add(current.toString());

        for (String token : tokens) {
            String value = token.trim();
            if (value.isEmpty()) {
                continue;
            }
            if ((value.startsWith("'") && value.endsWith("'"))
                    || (value.startsWith("\"") && value.endsWith("\""))) {
                args.add(value.substring(1, value.length() - 1));
            } else if ("true".equalsIgnoreCase(value) || "false".equalsIgnoreCase(value)) {
                args.add(Boolean.parseBoolean(value));
            } else if (value.matches("-?\\d+")) {
                args.add(Integer.parseInt(value));
            } else if (value.matches("-?\\d+\\.\\d+")) {
                args.add(Double.parseDouble(value));
            } else {
                args.add(value);
            }
        }
        return args;
    }

    private void validateInvokeTarget(String invokeTarget) {
        if (invokeTarget == null || !INVOKE_TARGET_PATTERN.matcher(invokeTarget.trim()).matches()) {
            throw new BusinessException(ErrorCode.PARAM_ERROR, "调用目标字符串格式错误，应为 beanName.method(args)");
        }
    }

    private SysJob requireJob(Integer id) {
        SysJob job = sysJobMapper.selectById(id);
        if (job == null) {
            throw new BusinessException(ErrorCode.JOB_NOT_FOUND);
        }
        return job;
    }

    /**
     * 兼容 Quartz 风格的 ?，Spring 的 cron 用 * 更稳妥
     */
    private String normalizeCron(String cron) {
        return cron == null ? null : cron.trim().replace('?', '*');
    }

    private boolean isValidCron(String cron) {
        if (!StringUtils.hasText(cron)) {
            return false;
        }
        try {
            CronExpression.parse(normalizeCron(cron));
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private LocalDateTime nextValidTime(String cron) {
        try {
            return CronExpression.parse(normalizeCron(cron)).next(LocalDateTime.now());
        } catch (Exception e) {
            return null;
        }
    }

    private String stackTrace(Throwable throwable) {
        StringWriter writer = new StringWriter();
        throwable.printStackTrace(new PrintWriter(writer));
        return writer.toString();
    }

    private JobVo toVo(SysJob job) {
        JobVo vo = new JobVo();
        BeanUtils.copyProperties(job, vo);
        vo.setJobId(job.getId());
        return vo;
    }
}
