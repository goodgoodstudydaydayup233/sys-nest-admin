package com.sysnest.admin.modules.job.service;

import com.sysnest.admin.common.enums.ErrorCode;
import com.sysnest.admin.common.exception.BusinessException;
import com.sysnest.admin.common.schedule.DynamicTaskScheduler;
import com.sysnest.admin.modules.job.dto.JobSaveDto;
import com.sysnest.admin.modules.job.entity.SysJob;
import com.sysnest.admin.modules.job.entity.SysJobLog;
import com.sysnest.admin.modules.job.mapper.SysJobLogMapper;
import com.sysnest.admin.modules.job.mapper.SysJobMapper;
import com.sysnest.admin.modules.job.vo.JobVo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.NoSuchBeanDefinitionException;
import org.springframework.context.ApplicationContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 定时任务单元测试：cron 校验、创建注册、手动执行、执行失败日志
 */
@ExtendWith(MockitoExtension.class)
class JobServiceTest {

    @Mock
    private SysJobMapper sysJobMapper;

    @Mock
    private SysJobLogMapper sysJobLogMapper;

    @Mock
    private DynamicTaskScheduler dynamicTaskScheduler;

    @Mock
    private ApplicationContext applicationContext;

    @InjectMocks
    private JobService jobService;

    @Test
    void invalidCronThrows8002() {
        JobSaveDto dto = validDto();
        dto.setCronExpression("bad cron");

        BusinessException exception = assertThrows(BusinessException.class, () -> jobService.create(dto));

        assertEquals(ErrorCode.JOB_CRON_INVALID.getCode(), exception.getCode());
        verify(sysJobMapper, never()).insert(any(SysJob.class));
    }

    @Test
    void createPausedJobDoesNotRegisterSchedule() {
        JobSaveDto dto = validDto();
        dto.setStatus("1");
        doAnswer(invocation -> {
            SysJob job = invocation.getArgument(0);
            job.setId(10);
            return 1;
        }).when(sysJobMapper).insert(any(SysJob.class));

        JobVo vo = jobService.create(dto);

        assertEquals(10, vo.getJobId());
        assertEquals("0/10 * * * * *", vo.getCronExpression());
        verify(dynamicTaskScheduler, never()).schedule(anyInt(), anyString(), any());
    }

    @Test
    void manualRunInvokesBeanAndWritesSuccessLog() {
        SysJob job = job();
        when(sysJobMapper.selectById(1)).thenReturn(job);
        when(applicationContext.getBean("stTask")).thenReturn(new SampleTask());

        jobService.run(1);

        ArgumentCaptor<SysJobLog> captor = ArgumentCaptor.forClass(SysJobLog.class);
        verify(sysJobLogMapper).insert(captor.capture());
        SysJobLog log = captor.getValue();
        assertEquals("0", log.getStatus());
        assertTrue(log.getJobMessage().startsWith("手动触发："));
    }

    @Test
    void missingBeanWritesFailureLog() {
        SysJob job = job();
        when(sysJobMapper.selectById(1)).thenReturn(job);
        when(applicationContext.getBean("stTask"))
                .thenThrow(new NoSuchBeanDefinitionException("stTask"));

        jobService.run(1);

        ArgumentCaptor<SysJobLog> captor = ArgumentCaptor.forClass(SysJobLog.class);
        verify(sysJobLogMapper).insert(captor.capture());
        SysJobLog log = captor.getValue();
        assertEquals("1", log.getStatus());
        assertEquals("手动触发：执行失败", log.getJobMessage());
        assertNotNull(log.getExceptionInfo());
    }

    private JobSaveDto validDto() {
        JobSaveDto dto = new JobSaveDto();
        dto.setJobName("测试任务");
        dto.setInvokeTarget("stTask.stNoParams()");
        dto.setCronExpression("0/10 * * * * ?");
        return dto;
    }

    private SysJob job() {
        SysJob job = new SysJob();
        job.setId(1);
        job.setJobName("测试任务");
        job.setJobGroup("DEFAULT");
        job.setInvokeTarget("stTask.stNoParams()");
        job.setCronExpression("0/10 * * * * ?");
        job.setMisfirePolicy("3");
        job.setConcurrent("1");
        job.setStatus("1");
        return job;
    }
}
