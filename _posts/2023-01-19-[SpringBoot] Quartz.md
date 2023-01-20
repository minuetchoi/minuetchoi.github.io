---
layout: post
title: "[SpringBoot] SpringBoot에서 Quartz 적용"
date: 2023-01-19 12:00:00 +0900
category: springboot
---

# SpringBoot + Quartz 스케쥴러 배치 구성

스케줄러 Quartz를 사용하는 방법을 알아 보려고 합니다.

사람들이 배치와 스케쥴러를 많이 혼동 하시는데 다른 개념이라고 보시면 됩니다.

차이점은 다음과 같다.

## 배치와 스케줄러의 차이점

안녕하세요. 오늘은 많이 사용하는 Spring Batch를 설명해 드릴려고 합니다.

Batch를 사용하기 위해선 스케줄러를 같이 사용하는데 대표적으로 아래와 같습니다.

1. 쉽게 어노테이션으로 사용가능 한 @Scheduled
1. DB 클러스터링을 도와주는 Quartz
1. CI/CD 젠킨스

### ``Batch``란?
우리는 흔히 일을 진행하면서 아래와 같은 작업이 필요한 경우가 발생합니다.

- 많은 양의 데이터를 처리한 결과값을 저장하거나 이러한 결과를 사용자에게 보여줘야 하는 경우
- 배송중인 상태로 5일이 지나면 배송완료 상태로 변경
- 구매완료 7일 이후 자동 구매확정

서비스를 운영하다 보시면 위와 같은 수많은 케이스가 발생 할 것입니다.

이러한 케이스를 실시간으로 반영할 수 있을까요?

물론 가능합니다만 너무 방비적이고 실시간으로 수만개의 레코드를 Processing 하는 것은 자칫하다간 장애를 일으킬 수 있는 문제입니다.

때문에 이러한 것들은 사용자의 요청이 많이 발생하지 않는 새벽이라던가 특정 시간때에 작업을 하면 더 효율적으로 서비스를 운영할 수 있을 겁니다.

그러기 위해서 필요한 것이 바로 Batch 입니다.

★ 즉, Batch 는 대용량의 데이터를 처리한다.

이러한 Batch에 대표적인게 Spring Batch 입니다.

Spring Batch 는 로깅, 트랜잭션, 청크, 실패에 따른 재시작, 특정, Job에 뒤에 Job을 실행, Job의 성공여부 등 수많은 Batch에 필요한 기능들을 제공합니다.

### ``Schedular``란?

스케줄러의 사전적 의미는 ``시간에 따라 구체적으로 세운 계획`` 입니다.

즉, 시간에 따라 특정 JOB을 실행 하도록 도와주는 것입니다.

때문에 스케줄러는 시간에 따른 특정 작업을 실행하고 관리하는데 특화 되어 있지 특정 Job의 성공여부, 실패에 따른 재시작 등을 관리하는 Batch와는 완전히 다른 개념입니다.


## Quartz를 사용하는 이유

스케쥴러 Quartz를 사용하는 이유는 무엇일까요?

간단하게 스프링에서 제공해주는 @Schedualed를 통해서 사용할 수 있는데 말이죠

저는 아래 내용인것 같습니다.

- In-memory Job Scheduler
- DB를 이용한 쿨러스터링

만약 여러개의 배치 서버가 도는 경우 한쪽 서버에서만 특정 Job이 수행되도록 해줘야 합니다.

물론 개발자가 이러한 기능을 개발할 수 있겠지만 Quartz는 이러한 기능을 DB를 통한 Clustering 방식으로 손쉽게 사용할 수 있도록 지원해주고 있습니다.

또한 필요에 따르면 DB를 이용하지 않고 Memory에서 가능하도록 하는 기능도 제공해주고 있습니다.

## Quartz 구성요소

- Scheduler: 스케줄을 관리 하는 객체입니다.
- JobDetail: Job을 실행시키기 위한 필요 정보를 담고 있습니다. JobDetail을 만들기 위해 필요한 것은 Job의 이름, Job의 파라미터인 JobDataMap, Job을 언제 동작시킬지에 대한 정보 Trigger가 필요합니다.
- Trigger: Job을 언제 동작시킬지, 몇번 반복시킬지에 대한 정보를 담고 있습니다. 날짜 정보는 흔히 사용하는 Cron 형식으로 구성 가능합니다.
- JobDataMap: Job을 동작시키는데 필요한 Parameter를 담고 있습니다. 흔히 날짜, 횟수에 대한 정보를 담아서 동작시킵니다.
- JobListener: Job이 실행될 때의 이벤트 정보를 담고 있습니다. Job이 실행 되기전, 중단, 실행완료 후 각종 이벤트를 넣어 줄 수 있습니다.l
- TriggerListener: Trigger가 실행될 때의 이벤트 정보를 담고 있습니다.

## Quartz 예제

![alt text](/public/img/springboot_01.png)

Quartz를 이용하기 위해서는 Quartz에서 사용하는 table이 필요합니다.

자동으로 Schema를 생성해주는 설정이 있지만, 저는 수동으로 Schema를 구성하는 방법을 선택하려고 합니다.

```sql
#
# Quartz seems to work best with the driver mm.mysql-2.0.7-bin.jar
#
# PLEASE consider using mysql with innodb tables to avoid locking issues
#
# In your Quartz properties file, you'll need to set
# org.quartz.jobStore.driverDelegateClass = org.quartz.impl.jdbcjobstore.StdJDBCDelegate
#

DROP TABLE IF EXISTS QRTZ_FIRED_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_PAUSED_TRIGGER_GRPS;
DROP TABLE IF EXISTS QRTZ_SCHEDULER_STATE;
DROP TABLE IF EXISTS QRTZ_LOCKS;
DROP TABLE IF EXISTS QRTZ_SIMPLE_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_SIMPROP_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_CRON_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_BLOB_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_TRIGGERS;
DROP TABLE IF EXISTS QRTZ_JOB_DETAILS;
DROP TABLE IF EXISTS QRTZ_CALENDARS;


CREATE TABLE QRTZ_JOB_DETAILS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    JOB_NAME  VARCHAR(200) NOT NULL,
    JOB_GROUP VARCHAR(200) NOT NULL,
    DESCRIPTION VARCHAR(250) NULL,
    JOB_CLASS_NAME   VARCHAR(250) NOT NULL,
    IS_DURABLE VARCHAR(1) NOT NULL,
    IS_NONCONCURRENT VARCHAR(1) NOT NULL,
    IS_UPDATE_DATA VARCHAR(1) NOT NULL,
    REQUESTS_RECOVERY VARCHAR(1) NOT NULL,
    JOB_DATA BLOB NULL,
    PRIMARY KEY (SCHED_NAME,JOB_NAME,JOB_GROUP)
);

CREATE TABLE QRTZ_TRIGGERS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    JOB_NAME  VARCHAR(200) NOT NULL,
    JOB_GROUP VARCHAR(200) NOT NULL,
    DESCRIPTION VARCHAR(250) NULL,
    NEXT_FIRE_TIME BIGINT(13) NULL,
    PREV_FIRE_TIME BIGINT(13) NULL,
    PRIORITY INTEGER NULL,
    TRIGGER_STATE VARCHAR(16) NOT NULL,
    TRIGGER_TYPE VARCHAR(8) NOT NULL,
    START_TIME BIGINT(13) NOT NULL,
    END_TIME BIGINT(13) NULL,
    CALENDAR_NAME VARCHAR(200) NULL,
    MISFIRE_INSTR SMALLINT(2) NULL,
    JOB_DATA BLOB NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,JOB_NAME,JOB_GROUP)
        REFERENCES QRTZ_JOB_DETAILS(SCHED_NAME,JOB_NAME,JOB_GROUP)
);

CREATE TABLE QRTZ_SIMPLE_TRIGGERS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    REPEAT_COUNT BIGINT(7) NOT NULL,
    REPEAT_INTERVAL BIGINT(12) NOT NULL,
    TIMES_TRIGGERED BIGINT(10) NOT NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
        REFERENCES QRTZ_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
);

CREATE TABLE QRTZ_CRON_TRIGGERS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    CRON_EXPRESSION VARCHAR(200) NOT NULL,
    TIME_ZONE_ID VARCHAR(80),
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
        REFERENCES QRTZ_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
);

CREATE TABLE QRTZ_SIMPROP_TRIGGERS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    STR_PROP_1 VARCHAR(512) NULL,
    STR_PROP_2 VARCHAR(512) NULL,
    STR_PROP_3 VARCHAR(512) NULL,
    INT_PROP_1 INT NULL,
    INT_PROP_2 INT NULL,
    LONG_PROP_1 BIGINT NULL,
    LONG_PROP_2 BIGINT NULL,
    DEC_PROP_1 NUMERIC(13,4) NULL,
    DEC_PROP_2 NUMERIC(13,4) NULL,
    BOOL_PROP_1 VARCHAR(1) NULL,
    BOOL_PROP_2 VARCHAR(1) NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
    REFERENCES QRTZ_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
);

CREATE TABLE QRTZ_BLOB_TRIGGERS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    BLOB_DATA BLOB NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP),
    FOREIGN KEY (SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
        REFERENCES QRTZ_TRIGGERS(SCHED_NAME,TRIGGER_NAME,TRIGGER_GROUP)
);

CREATE TABLE QRTZ_CALENDARS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    CALENDAR_NAME  VARCHAR(200) NOT NULL,
    CALENDAR BLOB NOT NULL,
    PRIMARY KEY (SCHED_NAME,CALENDAR_NAME)
);

CREATE TABLE QRTZ_PAUSED_TRIGGER_GRPS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    TRIGGER_GROUP  VARCHAR(200) NOT NULL,
    PRIMARY KEY (SCHED_NAME,TRIGGER_GROUP)
);

CREATE TABLE QRTZ_FIRED_TRIGGERS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    ENTRY_ID VARCHAR(95) NOT NULL,
    TRIGGER_NAME VARCHAR(200) NOT NULL,
    TRIGGER_GROUP VARCHAR(200) NOT NULL,
    INSTANCE_NAME VARCHAR(200) NOT NULL,
    FIRED_TIME BIGINT(13) NOT NULL,
    SCHED_TIME BIGINT(13) NOT NULL,
    PRIORITY INTEGER NOT NULL,
    STATE VARCHAR(16) NOT NULL,
    JOB_NAME VARCHAR(200) NULL,
    JOB_GROUP VARCHAR(200) NULL,
    IS_NONCONCURRENT VARCHAR(1) NULL,
    REQUESTS_RECOVERY VARCHAR(1) NULL,
    PRIMARY KEY (SCHED_NAME,ENTRY_ID)
);

CREATE TABLE QRTZ_SCHEDULER_STATE
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    INSTANCE_NAME VARCHAR(200) NOT NULL,
    LAST_CHECKIN_TIME BIGINT(13) NOT NULL,
    CHECKIN_INTERVAL BIGINT(13) NOT NULL,
    PRIMARY KEY (SCHED_NAME,INSTANCE_NAME)
);

CREATE TABLE QRTZ_LOCKS
  (
    SCHED_NAME VARCHAR(120) NOT NULL,
    LOCK_NAME  VARCHAR(40) NOT NULL,
    PRIMARY KEY (SCHED_NAME,LOCK_NAME)
);


commit;
```

그러면 이제 Quartz를 사용하기 위한 Dependency와 yml파일을 설정해주세요.

```java
package com.example.vuebackboard.api.config.quartz.factory;

import org.quartz.spi.TriggerFiredBundle;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;

public class AutowiringSpringBeanJobFactory extends SpringBeanJobFactory implements ApplicationContextAware {

    private transient AutowireCapableBeanFactory beanFactory;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        beanFactory = applicationContext.getAutowireCapableBeanFactory();
    }

    @Override
    protected Object createJobInstance(TriggerFiredBundle bundle) throws Exception {
        final Object job = super.createJobInstance(bundle);
        beanFactory.autowireBean(job);
        return job;
    }
}

```

Job Class는 Dependency를 해주지 않습니다.

하지만 대부분의 기능은 Dependency를 통해서 어떤 특정 기능을 수행하는데 AutoWiringSpringBeanJobFactory는 JobClass에서 Dependency가 가능하도록 도와주는 기능을 담당합니다.

```java
package com.example.vuebackboard.api.config.quartz.listener;

import lombok.extern.slf4j.Slf4j;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.quartz.JobListener;

@Slf4j
public class QuartzJobListener implements JobListener {
    @Override
    public String getName() {
        return this.getClass().getName();
    }

    @Override
    public void jobToBeExecuted(JobExecutionContext context) {
        log.info("Job 수행 되기 전");
    }

    @Override
    public void jobExecutionVetoed(JobExecutionContext context) {
        log.info("Job 중단");
    }

    @Override
    public void jobWasExecuted(JobExecutionContext context, JobExecutionException jobException) {
        log.info("Job 수행 완료 후");
    }
}
```

JobListener는 Job 실행 전후에 event를 걸어주는 역활을 담당합니다.

```java
package com.example.vuebackboard.api.config.quartz.factory;

import org.quartz.spi.TriggerFiredBundle;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.AutowireCapableBeanFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;

public class AutowiringSpringBeanJobFactory extends SpringBeanJobFactory implements ApplicationContextAware {

    private transient AutowireCapableBeanFactory beanFactory;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        beanFactory = applicationContext.getAutowireCapableBeanFactory();
    }

    @Override
    protected Object createJobInstance(TriggerFiredBundle bundle) throws Exception {
        final Object job = super.createJobInstance(bundle);
        beanFactory.autowireBean(job);
        return job;
    }
}

```

TriggerLisenter는 Trigger실행 전후에 event를 걸러주는 역활을 담당합니다.

```java
package com.example.vuebackboard.api.config.quartz;

import com.example.vuebackboard.api.config.quartz.factory.AutowiringSpringBeanJobFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Scheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.quartz.QuartzProperties;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class QuartzConfig {

    @Autowired
    QuartzProperties quartzProperties;

    @Bean
    public SchedulerFactoryBean schedulerFactoryBean(ApplicationContext applicationContext, DataSource dataSource) {
        SchedulerFactoryBean schedulerFactoryBean = new SchedulerFactoryBean();

        AutowiringSpringBeanJobFactory jobFactory = new AutowiringSpringBeanJobFactory();
        jobFactory.setApplicationContext(applicationContext);

        schedulerFactoryBean.setJobFactory(jobFactory);
        schedulerFactoryBean.setApplicationContext(applicationContext);
        schedulerFactoryBean.setDataSource(dataSource);

        Properties properties = new Properties();
        properties.putAll(quartzProperties.getProperties());

        // schedulerFactoryBean.setGlobalTriggerListeners(triggersListener);
        // schedulerFactoryBean.setGlobalJobListeners(jobsListener);

        schedulerFactoryBean.setQuartzProperties(properties);

        return schedulerFactoryBean;
    }

    @Bean
    Scheduler scheduler(SchedulerFactoryBean schedulerFactoryBean) {
        return schedulerFactoryBean.getScheduler();
    }
}

```

```java
package com.example.vuebackboard.api.config.quartz.job;

import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
// @RequiredArgsConstructor 사용x
public class QuartzJob implements Job {

    // private MarketRepository marketRepository;

    @Override
    public void execute(JobExecutionContext context) throws JobExecutionException {

        log.info("Quartz Job Executed");

        JobDataMap dataMap = context.getJobDetail().getJobDataMap();
        log.info("dataMap date : {}", dataMap.get("date"));
        log.info("dataMap executeCount : {}", dataMap.get("executeCount"));

        // JobDataMap를 통해 Job의 실행 횟수를 받아서 횟수 + 1을 한다.
        int cnt = (int) dataMap.get("executeCount");
        dataMap.put("executeCount", ++cnt);

        // Market 테이블에 현재 시간을 insert 한다.

//        Market market = new Market();
//        market.setName(String.format("%s", dataMap.get("date")));
//        market.setPrice(3000);
//        marketrepository.save(market);

    }
}
```

Lombok에서 제공하는 @RequiredArgsConstructor를 통해 Dependency를 받는 경우가 많은데,

이 경우 위에서 설명한 것 같이 Dependency를 받지 못합니다.

때문에 위에서 AutoWiringSpringBeanJobFactory를 설정했기 때문에 @Autowired를 사용할 수 있어 Dependency를 받아 사용 가능합니다.

@PersistJobDataAfterExecution는 Job 이 동작중에 JobDataMap를 변경할 때 사용합니다.

```java
package com.example.vuebackboard.api.config.quartz.service;

import com.example.vuebackboard.api.config.quartz.job.QuartzJob;
import com.example.vuebackboard.api.config.quartz.listener.QuartzJobListener;
import com.example.vuebackboard.api.config.quartz.listener.QuartzTriggerListener;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class QuartzService {

    private final Scheduler scheduler;

    @PostConstruct
    public void init() {
        try {
            // 스케줄러 초기화 -> DB도 클리어
            scheduler.clear();

            // Job리스너 등록
            scheduler.getListenerManager().addJobListener(new QuartzJobListener());

            // Trigger 리스너 등록
            scheduler.getListenerManager().addTriggerListener(new QuartzTriggerListener());

            // Job에 필요한 Parameter 생성
            Map map = new HashMap<>();
            // Job의 실행횟수 및 실행시간
            map.put("executeCount", 1);
            map.put("date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            // Job생성 및 Scheduler에 등록
            addJob(QuartzJob.class, "QuartzJob", "Quartz Job 입니다.", map, "0/5 * * * * ?");

        } catch (Exception e) {
            log.error("addJob error : {}", e);
        }
    }

    public <T extends Job> void addJob(Class<? extends Job> job, String name, String desc, Map map, String cron) throws SchedulerException {
        JobDetail jobDetail = buildJobDetail(job, name, desc, map);
        Trigger trigger = buildCronTrigger(cron);
        if (scheduler.checkExists(jobDetail.getKey())) scheduler.deleteJob(jobDetail.getKey());
        scheduler.scheduleJob(jobDetail, trigger);
    }

    /**
     * job detail 생성
     *
     * @param job
     * @param name
     * @param desc
     * @param map
     * @return
     */
    private JobDetail buildJobDetail(Class<? extends Job> job, String name, String desc, Map map) {
        JobDataMap jobDataMap = new JobDataMap();
        jobDataMap.putAll(map);

        return JobBuilder.newJob(job).withIdentity(name).withDescription(desc).usingJobData(jobDataMap).build();
    }

    /**
     * trigger 생성
     *
     * @param cron
     * @return
     */
    private Trigger buildCronTrigger(String cronExp) {
        return TriggerBuilder.newTrigger().withSchedule(CronScheduleBuilder.cronSchedule(cronExp)).build();
    }
}
```

전체적인 Quartz가 동작하는 flow는 아래와 같습니다.

1. scheduler 초기화 => DB내용도 초기화가 이뤄집니다.
1. Job, Trigger, Listener 등록
1. map을 통해 Job에 넘길 카운트 횟수, Job이 동작하는 시간 생성
1. QuartzJob class와 동작시킬 Job의 이름, Job의 설명, map, 동작시킬 시간을 addJob에게 넘겨 Job을 생성
1. schedulerFactoryBean.setAutoStartup(true)를 통해서 어플리케이션 동작시 자동으로 Quartz가 작동하여 정해진 시간에 Job을 실행
1. Job이 실행될 때 triggerListener가 동작하여 vetoJobExecution을 통해 Job의 실행 상태를 체크한다. 상태체크는 해당 Job이 2번이상 실행되면 false를 return 하고 JobListener의 jobExecutionVetoed가 동작하여 더이상 Job이 동작하지 않는다.


## Quartz 메타 테이블

- QRTZ_LOCKS
    - 동일한 작업을 실행하는 여러 노드의 시나리오를 피하기 위해 작업을 실행하는 인스턴스 이름의 값을 저장합니다.

- QRTZ_TRIGGERS
    - 트리거의 일반 정보
    - 저장된 모든 트리거의 일반 정보 / 트리거의 종류를 구별

- QRTZ_JOB_DETAILS
    - 실행할 작업
    - 실행될 Quartz Job 정보

- QRTZ_FIRED_TRIGGERS
    - 현재 실행된 (fired) 스케줄의 트리거 정보
    - 비동기 동작 시 바로 실행 완료 상태가 되어서 해당 테이블은 스쳐지나감

- QRTZ_PAUSED_TRIGGER_GRPS
    - 활성화되지 않은 트리거에 대한 저장된 정보
    - 정지된 트리거 그룹