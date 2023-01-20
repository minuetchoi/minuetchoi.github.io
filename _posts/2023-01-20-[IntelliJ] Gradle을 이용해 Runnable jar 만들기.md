---
layout: post
title: "[IntelliJ] Gradle을 이용해 Runnable jar만들기"
date: 2023-01-19 12:00:00 +0900
category: intelliJ
---

IntelliJ에서 JAR파일을 만드는 2가지 방법은 다음과 같다.
- Gradle 이 적용된 프로젝트에서 tasks → jar 를 실행하여 만드는 방법
- IntelliJ 프로젝트의 Settings에서 artifacts를 등록하여 만드는 방법

본인은 Gradle이 적용된 프로젝트에서 tasks 를 이용해 jar 파일을 만들어 본다.

build.gradle 파일안에 다음과 같은 소스를 추가한다.

```gradle
sourceSets {
    main {
        resources {
            srcDirs "src/main/resources" // resources 영역배포
        }
    }
}
jar{
    manifest {
        attributes 'Main-Class': 'kr.co.daemon.batch.BatchDaemon' // runnable class 파일
    }
    from {
        configurations.runtimeClasspath.collect {
            it.isDirectory() ? it : zipTree(it) // dependencys library 추가
        }
    }
}
```

Runnable jar를 만들기 위해서는 메인 클래스를 등록해줘야 한다.

예) kr.co.daemon.batch.BatchDaemon

이제 gradle tasks에 jar 파일을 실행시켜보자

![alt text](/public/img/IntelliJ_06.png)

다음과 같이 실행되면 jar파일이 build/libs 아래 생성될 것이다.

```console
오후 1:11:31: Executing 'jar'...

> Task :compileJava UP-TO-DATE
> Task :processResources UP-TO-DATE
> Task :classes UP-TO-DATE
> Task :jar

Deprecated Gradle features were used in this build, making it incompatible with Gradle 7.0.
Use '--warning-mode all' to show the individual deprecation warnings.
See https://docs.gradle.org/6.9/userguide/command_line_interface.html#sec:command_line_warnings

BUILD SUCCESSFUL in 9s
3 actionable tasks: 1 executed, 2 up-to-date
오후 1:11:41: Execution finished 'jar'.

```

다음은 jar를 파일을 실행하는 명령어이다.

예)
```console
java -Dfile.encoding=euc-kr \
 -cp D:/PALETTE2/hkcloud/ldcs/repository/git/palette2-hkcloud-ldcs-batch/build/libs/daemon-batch-0.0.1-SNAPSHOT-all.jar \
 kr.co.daemon.batch.job.PltIamAccSync 20230116090449637BATzgXkZ BATCH NULL
```