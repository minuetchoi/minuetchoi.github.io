---
layout: post
title: "[SpringBoot] xxl-job-admin으로 스프링 배치 스케줄러관리"
date: 2023-01-20 12:00:00 +0900
category: springboot
---

[Do Something 님](https://onethejay.tistory.com/){:target="_blank"} 

[Xuxueli 공식사이트](https://github.com/xuxueli/xxl-job){:target="_blank"} 


# BATCH 관리

이전에는 컨트롤러에 Scheduler 어노테이션을 사용하여 Cron방식으로 예약된 일괄 작업을 수행했습니다.

이제는 어드민 화면을 통해 쉽게 관리하고 로그를 확인할 수 있습니다.

포스팅에서 구현할 관리 서비스는 XXL-JOB-ADMIN 입니다.

# XXL-JOB-ADMIN

- 기존에 Scheduler 어노테이션으로 관리하던 예약 작업을 간편하게 관리할 수 있습니다.
- 기본적인 예약은 물론, 필요 시에는 직접 호출이 가능합니다.
- Xxljob 어노테이션으로 지정하면 job-admin에서 해당 Job을 호출합니다.
- RestController 를 구현할 필요없이 Service 메서드에 어노테이션을 붙여서 호출이 가능해집니다.
- job-admin에서 호출 횟수, 기본 param 등을 세팅하여 호출할 수 있으며 실패시 email로 알림을 받을 수 있습니다.
- 로그 및 대시보드를 지원하므로 모니터링이 쉬워집니다.

# XXL-JOB 어드민 프로젝트 다운로드

프로젝트를 다운로드 받고 압출을 해제합니다.

[https://github.com/onethejay/xxl-job-admin](https://github.com/onethejay/xxl-job-admin){:target="_blank"}

IntelliJ로 소스를 open 합니다.

# XXL JOB 어드민 초기 세팅하기

어드민 프로젝트를 시작하려면 먼저 DB세팅이 필요합니다.

Docker 또는 로컬, AWS 등의 환경에 MySQL이 세팅되어 있어야 합니다.

이번 포스팅에서는 Docker에 MySQL를 설치하였습니다.

MySQL이 설치되었다면 소스 프로젝트에 있는 init.db_sql 파일 안의 내용을 복사하여 DB에 실행합니다.

```sql
# Copyright (c) 2015-present, xuxueli.

CREATE database if NOT EXISTS `xxl_job` default character set utf8mb4 collate utf8mb4_unicode_ci;
use `xxl_job`;

SET NAMES utf8mb4;

CREATE TABLE `xxl_job_info` (
                                `id` int(11) NOT NULL AUTO_INCREMENT,
                                `job_group` int(11) NOT NULL COMMENT '작업 그룹 ID',
                                `job_desc` varchar(255) NOT NULL,
                                `add_time` datetime DEFAULT NULL,
                                `update_time` datetime DEFAULT NULL,
                                `author` varchar(64) DEFAULT NULL COMMENT '작성자',
                                `alarm_email` varchar(255) DEFAULT NULL COMMENT '알람 메일',
                                `schedule_type` varchar(50) NOT NULL DEFAULT 'NONE' COMMENT '일정 유형',
                                `schedule_conf` varchar(128) DEFAULT NULL COMMENT '스케줄러 설정, 값의 의미는 스케줄러 종류에 따라 달라집니다.',
                                `misfire_strategy` varchar(50) NOT NULL DEFAULT 'DO_NOTHING' COMMENT '실패시 정책',
                                `executor_route_strategy` varchar(50) DEFAULT NULL COMMENT 'Executor 경로 정책',
                                `executor_handler` varchar(255) DEFAULT NULL COMMENT 'Executor handler 이름',
                                `executor_param` varchar(512) DEFAULT NULL COMMENT 'Executor 파라미터',
                                `executor_block_strategy` varchar(50) DEFAULT NULL COMMENT 'Executor 차단 정책',
                                `executor_timeout` int(11) NOT NULL DEFAULT '0' COMMENT 'Executor timeout',
                                `executor_fail_retry_count` int(11) NOT NULL DEFAULT '0' COMMENT 'Executor 실패 재시도 횟수',
                                `glue_type` varchar(50) NOT NULL COMMENT 'GLUE 타입',
                                `glue_source` mediumtext COMMENT 'GLUE 소스코드',
                                `glue_remark` varchar(128) DEFAULT NULL COMMENT 'GLUE 설명',
                                `glue_updatetime` datetime DEFAULT NULL COMMENT 'GLUE 수정시간',
                                `child_jobid` varchar(255) DEFAULT NULL COMMENT '자식 job ID, 쉼표로 구분하여 여러개 입력 가능',
                                `trigger_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '스케쥴러 상태 0-정지，1-실행',
                                `trigger_last_time` bigint(13) NOT NULL DEFAULT '0' COMMENT '마지막 실행 시간',
                                `trigger_next_time` bigint(13) NOT NULL DEFAULT '0' COMMENT '다음 실행 시간',
                                PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `xxl_job_log` (
                               `id` bigint(20) NOT NULL AUTO_INCREMENT,
                               `job_group` int(11) NOT NULL COMMENT '작업 그룹 ID',
                               `job_id` int(11) NOT NULL COMMENT '작업 ID',
                               `executor_address` varchar(255) DEFAULT NULL COMMENT 'Executor 주소, 최근 실행 주소',
                               `executor_handler` varchar(255) DEFAULT NULL COMMENT 'Executor handler 이름',
                               `executor_param` varchar(512) DEFAULT NULL COMMENT 'Executor 파라미터',
                               `executor_sharding_param` varchar(20) DEFAULT NULL COMMENT 'Executor 샤딩 파라미터, 1/2 형식',
                               `executor_fail_retry_count` int(11) NOT NULL DEFAULT '0' COMMENT 'Executor 실패 재시도 횟수',
                               `trigger_time` datetime DEFAULT NULL COMMENT '호출 시간',
                               `trigger_code` int(11) NOT NULL COMMENT '호출 결과 코드',
                               `trigger_msg` text COMMENT '호출 결과 메시지',
                               `handle_time` datetime DEFAULT NULL COMMENT '실행 시간',
                               `handle_code` int(11) NOT NULL COMMENT '실행 결과 코드',
                               `handle_msg` text COMMENT '실행 결과 메시지',
                               `alarm_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '알람 발송 상태, 0-기본, 1-필요없음, 2-알람성공, 3-알람실패',
                               PRIMARY KEY (`id`),
                               KEY `I_trigger_time` (`trigger_time`),
                               KEY `I_handle_code` (`handle_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `xxl_job_log_report` (
                                      `id` int(11) NOT NULL AUTO_INCREMENT,
                                      `trigger_day` datetime DEFAULT NULL COMMENT '호출 일자',
                                      `running_count` int(11) NOT NULL DEFAULT '0' COMMENT '실행중-로그갯수',
                                      `suc_count` int(11) NOT NULL DEFAULT '0' COMMENT '실행성공-로그갯수',
                                      `fail_count` int(11) NOT NULL DEFAULT '0' COMMENT '실행실패-로그갯수',
                                      `update_time` datetime DEFAULT NULL,
                                      PRIMARY KEY (`id`),
                                      UNIQUE KEY `i_trigger_day` (`trigger_day`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `xxl_job_logglue` (
                                   `id` int(11) NOT NULL AUTO_INCREMENT,
                                   `job_id` int(11) NOT NULL COMMENT '작업 ID',
                                   `glue_type` varchar(50) DEFAULT NULL COMMENT 'GLUE 타입',
                                   `glue_source` mediumtext COMMENT 'GLUE 소스코드',
                                   `glue_remark` varchar(128) NOT NULL COMMENT 'GLUE 설명',
                                   `add_time` datetime DEFAULT NULL,
                                   `update_time` datetime DEFAULT NULL,
                                   PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `xxl_job_registry` (
                                    `id` int(11) NOT NULL AUTO_INCREMENT,
                                    `registry_group` varchar(50) NOT NULL,
                                    `registry_key` varchar(255) NOT NULL,
                                    `registry_value` varchar(255) NOT NULL,
                                    `update_time` datetime DEFAULT NULL,
                                    PRIMARY KEY (`id`),
                                    KEY `i_g_k_v` (`registry_group`,`registry_key`,`registry_value`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `xxl_job_group` (
                                 `id` int(11) NOT NULL AUTO_INCREMENT,
                                 `app_name` varchar(64) NOT NULL COMMENT 'Executor AppName',
                                 `title` varchar(12) NOT NULL COMMENT 'Executor 제목',
                                 `address_type` tinyint(4) NOT NULL DEFAULT '0' COMMENT 'Executor 주소 유형 0=자동 등록, 1=수동 입력',
                                 `address_list` text COMMENT 'Executor 주소 목록, 쉼표로 구분하여 여러개 등록 가능',
                                 `update_time` datetime DEFAULT NULL,
                                 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `xxl_job_user` (
                                `id` int(11) NOT NULL AUTO_INCREMENT,
                                `username` varchar(50) NOT NULL COMMENT '로그인 ID',
                                `password` varchar(50) NOT NULL COMMENT '비밀번호',
                                `role` tinyint(4) NOT NULL COMMENT '사용자 구분, 0-일반사용자, 1-관리자',
                                `permission` varchar(255) DEFAULT NULL COMMENT '권한, 작업 그룹 ID 쉼표로 구분하여 여러개 등록 가능',
                                PRIMARY KEY (`id`),
                                UNIQUE KEY `i_username` (`username`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `xxl_job_lock` (
                                `lock_name` varchar(50) NOT NULL COMMENT 'LOCK NAME',
                                PRIMARY KEY (`lock_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `xxl_job_group`(`id`, `app_name`, `title`, `address_type`, `address_list`, `update_time`) VALUES (1, 'xxl-job-executor-sample', '示例执行器', 0, NULL, '2018-11-03 22:21:31' );
INSERT INTO `xxl_job_info`(`id`, `job_group`, `job_desc`, `add_time`, `update_time`, `author`, `alarm_email`, `schedule_type`, `schedule_conf`, `misfire_strategy`, `executor_route_strategy`, `executor_handler`, `executor_param`, `executor_block_strategy`, `executor_timeout`, `executor_fail_retry_count`, `glue_type`, `glue_source`, `glue_remark`, `glue_updatetime`, `child_jobid`) VALUES (1, 1, '测试任务1', '2018-11-03 22:21:31', '2018-11-03 22:21:31', 'XXL', '', 'CRON', '0 0 0 * * ? *', 'DO_NOTHING', 'FIRST', 'demoJobHandler', '', 'SERIAL_EXECUTION', 0, 0, 'BEAN', '', 'GLUE代码初始化', '2018-11-03 22:21:31', '');
INSERT INTO `xxl_job_user`(`id`, `username`, `password`, `role`, `permission`) VALUES (1, 'admin', 'e10adc3949ba59abbe56e057f20f883e', 1, NULL);
INSERT INTO `xxl_job_lock` ( `lock_name`) VALUES ( 'schedule_lock');

commit;
```

DB 세팅이 완료되었으면 소스의 application.properties 파일 xxl-job, datasource 부분의 username과 password 를 자신의 DB에 맞게 변경합니다.

```propertis
### xxl-job, datasource
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/xxl_job?useUnicode=true&characterEncoding=UTF-8&autoReconnect=true&serverTimezone=Asia/Seoul
spring.datasource.username=root
spring.datasource.password=1234
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
```

xxl-job, email부분을 수정하면 알림 메일을 수신할 수 있습니다.

```properties
### xxl-job, email
spring.mail.host=smtp.sample.com
spring.mail.port=25
spring.mail.username=username@sample.com
spring.mail.from=userfrom@sample.com
spring.mail.password=userpassword
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.socketFactory.class=javax.net.ssl.SSLSocketFactory
```

설정 완료 후 프로젝트를 실행합니다.

웹브라우저 http://localhost:8080/xxl-job-admin 을 통해서 어드민에 접속할 수 있습니다.

초기 아이디와 비밀번호는 admin / 123456 입니다.


# Executor 프로젝트 생성

xxl-job-admin에서 관리할 수 있는 프로젝트를 생성하고 Executor로 등록까지 진행해보겠습니다.

build.gradle의 dependencies에 xxl-job-core를 추가합니다.

```gradle
dependencies {
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'com.xuxueli.xxl-job-core:2.3.1'
    testImplementation 'org.springframeowrk.boot:spring-boot-starter-test'
}
```

application.yml 파일에 아래의 내용을 추가한다.

```yaml
# log config
logging:
    config: classpath:logback.xml
# xxl batch solution
xxl:
    job:
        admin:
            addresses: http://127.0.0.1:9090/xxl-job-admin
        accessToken:
        executor:
            appname: vue-backboard
            address:
            ip:
            port: 8081
            logpath: /data/applogs/xxl-job/jobhandler
            logretentiondays: 30
```


resources 폴더 아래 logback.xml 파일을 생성하고 아래 내용을 추가합니다.

```xml

<?xml version="1.0" encoding="UTF-8"?>
<configuration debug="false" scan="true" scanPeriod="1 seconds">

    <contextName>logback</contextName>
    <property name="log.path" value="/data/applogs/xxl-job/xxl-job-executor-sample-springboot.log"/>

    <appender name="console" class="ch.qos.logback.core.ConsoleAppender">
        <encoder>
            <pattern>%d{HH:mm:ss.SSS} %contextName [%thread] %-5level %logger{36} - %msg%n</pattern>
        </encoder>
    </appender>

    <appender name="file" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <file>${log.path}</file>
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <fileNamePattern>${log.path}.%d{yyyy-MM-dd}.zip</fileNamePattern>
        </rollingPolicy>
        <encoder>
            <pattern>%date %level [%thread] %logger{36} [%file : %line] %msg%n
            </pattern>
        </encoder>
    </appender>

    <root level="info">
        <appender-ref ref="console"/>
        <appender-ref ref="file"/>
    </root>

</configuration>
```

# XxlJobConfig 생성

logback 파일까지 생성했다면 이제 XxlJobConfig.java 를 생성하고 Bean 을 등록해야 합니다.

먼저 config 패키지 안에 XxlJobConfig.java 파일을 만들어줍니다.

```java
package com.example.vuebackboard.api.config.xxl;

import com.xxl.job.core.executor.impl.XxlJobSpringExecutor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class XxlJobConfig {

    @Value("${xxl.job.admin.addresses}")
    private String adminAddresses;

    @Value("${xxl.job.accessToken}")
    private String accessToken;

    @Value("${xxl.job.executor.appname}")
    private String appname;

    @Value("${xxl.job.executor.address}")
    private String address;

    @Value("${xxl.job.executor.ip}")
    private String ip;

    @Value("${xxl.job.executor.port}")
    private int port;

    @Value("${xxl.job.executor.logpath}")
    private String logPath;

    @Value("${xxl.job.executor.logretentiondays}")
    private int logRetentionDays;

    @Bean
    public XxlJobSpringExecutor xxlJobExecutor() {

        log.info(">>>>>>> xxl-job config init");
        XxlJobSpringExecutor xxlJobSpringExecutor = new XxlJobSpringExecutor();
        xxlJobSpringExecutor.setAdminAddresses(adminAddresses);
        xxlJobSpringExecutor.setAppname(appname);
        xxlJobSpringExecutor.setAddress(address);
        xxlJobSpringExecutor.setIp(ip);
        xxlJobSpringExecutor.setPort(port);
        xxlJobSpringExecutor.setAccessToken(accessToken);
        xxlJobSpringExecutor.setLogPath(logPath);
        xxlJobSpringExecutor.setLogRetentionDays(logRetentionDays);

        return xxlJobSpringExecutor;
    }
}

서버를 시작해보고 정상적으로 시작되는지 확인합니다.

```text
2023-01-25T13:32:50.596+09:00  INFO 15404 --- [  restartedMain] c.e.v.api.config.xxl.XxlJobConfig        : >>>>>>> xxl-job config init
2023-01-25T13:32:51.236+09:00  INFO 15404 --- [  restartedMain] org.quartz.impl.StdSchedulerFactory      : Using default implementation for ThreadExecutor
2023-01-25T13:32:51.259+09:00  INFO 15404 --- [  restartedMain] org.quartz.core.SchedulerSignalerImpl    : Initialized Scheduler Signaller of type: class org.quartz.core.SchedulerSignalerImpl
2023-01-25T13:32:51.259+09:00  INFO 15404 --- [  restartedMain] org.quartz.core.QuartzScheduler          : Quartz Scheduler v.2.3.2 created.
2023-01-25T13:32:51.261+09:00  INFO 15404 --- [  restartedMain] org.quartz.simpl.RAMJobStore             : RAMJobStore initialized.
2023-01-25T13:32:51.263+09:00  INFO 15404 --- [  restartedMain] org.quartz.core.QuartzScheduler          : Scheduler meta-data: Quartz Scheduler (v2.3.2) 'quartzScheduler' with instanceId 'NON_CLUSTERED'
  Scheduler class: 'org.quartz.core.QuartzScheduler' - running locally.
  NOT STARTED.
  Currently in standby mode.
  Number of jobs executed: 0
  Using thread pool 'org.quartz.simpl.SimpleThreadPool' - with 10 threads.
  Using job-store 'org.quartz.simpl.RAMJobStore' - which does not support persistence. and is not clustered.

2023-01-25T13:32:51.264+09:00  INFO 15404 --- [  restartedMain] org.quartz.impl.StdSchedulerFactory      : Quartz scheduler 'quartzScheduler' initialized from an externally provided properties instance.
2023-01-25T13:32:51.264+09:00  INFO 15404 --- [  restartedMain] org.quartz.impl.StdSchedulerFactory      : Quartz scheduler version: 2.3.2
2023-01-25T13:32:51.264+09:00  INFO 15404 --- [  restartedMain] org.quartz.core.QuartzScheduler          : JobFactory set to: org.springframework.scheduling.quartz.SpringBeanJobFactory@398b2387
2023-01-25T13:32:51.342+09:00  INFO 15404 --- [  restartedMain] o.s.b.d.a.OptionalLiveReloadServer       : LiveReload server is running on port 35729
2023-01-25T13:32:51.488+09:00  WARN 15404 --- [  restartedMain] c.xxl.job.core.executor.XxlJobExecutor   : >>>>>>>>>>> xxl-job accessToken is empty. To ensure system security, please set the accessToken.
2023-01-25T13:32:51.568+09:00  INFO 15404 --- [  restartedMain] o.s.b.w.embedded.tomcat.TomcatWebServer  : Tomcat started on port(s): 8081 (http) with context path ''
2023-01-25T13:32:51.570+09:00  INFO 15404 --- [  restartedMain] o.s.s.quartz.SchedulerFactoryBean        : Starting Quartz Scheduler now
2023-01-25T13:32:51.571+09:00  INFO 15404 --- [  restartedMain] org.quartz.core.QuartzScheduler          : Scheduler quartzScheduler_$_NON_CLUSTERED started.
2023-01-25T13:32:51.595+09:00  INFO 15404 --- [  restartedMain] c.e.v.VueBackboardApplication            : Started VueBackboardApplication in 4.62 seconds (process running for 5.564)
2023-01-25T13:32:52.048+09:00  INFO 15404 --- [      Thread-10] com.xxl.job.core.server.EmbedServer      : >>>>>>>>>>> xxl-job remoting server start success, nettype = class com.xxl.job.core.server.EmbedServer, port = 9999
```

# 어드민에 Executor 등록

![alt text](/public/img/springboot_03.png)

![alt text](/public/img/springboot_04.png)

# Executor에 Job 등록

이어서 Executor에 Job을 등록하고 호출해보겠습니다.

![alt text](/public/img/springboot_05.png)

Cron의 수정 버튼을 클릭하고 매 30초 마다 해당 Job을 호출할 수 있게 선택합니다.
(기존 Scheduler 어노테이션의 Cron을 직접 입력할 수도 있습니다.)

![alt text](/public/img/springboot_06.png)

선택 또는 입력 후 현재 Job을 저장합니다.

Job의 액션 오른쪽의 버튼을 클릭하면 나타나는 버튼 중 ``한번만 실행``을 클릭합니다.

![alt text](/public/img/springboot_07.png)

다른 추가 입력 없이 저장 버튼을 클릭하여 실행합니다.

![alt text](/public/img/springboot_08.png)

다시 액션의 호출 로그를 눌러서 로그를 확인해 봅니다.

![alt text](/public/img/springboot_09.png)

Executor에 sampleJobHandler를 생성하지 않아 500 에러가 발생했습니다.

![alt text](/public/img/springboot_10.png)

# Executor Job Handler 구현

어드민에 등록된 Executor의 JobHandler 를 호출했을 때 작업할 메소드를 구현한다.

서비스를 생성하고 호출 되었을 때 로그를 출력하는 메서드 (jobHandler)를 구현합니다.

```java
package com.example.vuebackboard.batch;

import com.xxl.job.core.context.XxlJobHelper;
import com.xxl.job.core.handler.annotation.XxlJob;
import org.springframework.stereotype.Service;

@Service
public class SampleService {

    @XxlJob("sampleJobHandler")
    public void sampleJobhandlerMethod() {
        String str = "이것도 가능합니다.";
        XxlJobHelper.log("여기에 로그를 작성하면 확인할 수 있습니다. {}", str);
    }
}
```

프로젝트를 재시작하고 어드민에서 호출해봅니다.

호출 결과 성공, 실행도 성공했습니다.

액션의 Rolling Log을 통해 로그를 확인할 수 있습니다.

![alt text](/public/img/springboot_11.png)


```log
2023-01-25 14:15:21 [com.xxl.job.core.thread.JobThread#run]-[133]-[xxl-job, JobThread-2-1674623721700] <br>----------- xxl-job job execute start -----------<br>----------- Param:
2023-01-25 14:15:21 [com.example.vuebackboard.batch.SampleService#sampleJobhandlerMethod]-[13]-[xxl-job, JobThread-2-1674623721700] 여기에 로그를 작성하면 확인할 수 있습니다. 이것도 가능합니다.
2023-01-25 14:15:21 [com.xxl.job.core.thread.JobThread#run]-[179]-[xxl-job, JobThread-2-1674623721700] <br>----------- xxl-job job execute end(finish) -----------<br>----------- Result: handleCode=200, handleMsg = null
2023-01-25 14:15:21 [com.xxl.job.core.thread.TriggerCallbackThread#callbackLog]-[197]-[xxl-job, executor TriggerCallbackThread] <br>----------- xxl-job job callback finish.
```