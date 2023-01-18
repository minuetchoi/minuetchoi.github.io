---
layout: post
title: "[IntellJ] IntelliJ첫걸음"
date: 2023-01-09 17:56:00 +0900
category: IntellJ
---

# IntelliJ 테마 변경하기

Ctrl + Alt + S 단축키로 Setting 화면에 들어간다.

왼쪽메뉴에서 [Appearance & Behavior] > [Appearance]

Theme: 기본적으로 가지고 있는 테마를 확인한다.

![alt text](/public/img/IntelliJ_01.png)

왼쪽 메뉴창에서 [Plugin] 선택 검색 키워드에 "Theme"를 입력한 후 [Enter]를 입력하여 검색한다.

개인적으로 Xcode Theme 가 좋은 것 같다.

![alt text](/public/img/IntelliJ_02.png)

재부팅후 다음과 같이 설정한다.

![alt text](/public/img/IntelliJ_03.png)

# IntelliJ 공백 표시

Ctrl + Alt + S 단축키로 Setting 화면에 들어간다.

왼쪽메뉴에서 [Edit] > [General] > [Appearance] 에서 Show whitespaces 를 체크한다.

참고로 whitespaces에 대한 색깔 지정은 다음과 같다.

![alt text](/public/img/IntelliJ_04.png)

# IntelliJ 폰트 변경 및 크기 조절

Ctrl + Alt + S 단축키로 Setting 화면에 들어간다.

왼쪽메뉴에서 [Edit] > [Font] 에서 Font, Size 항목을 변경한다.

개인적으로 Eclipse에서 기본으로 사용하는 ``Consolas`` 가 좋은 것 같다.

# IntelliJ 자동빌드

Ctrl + Alt + S 단축키로 Setting 화면에 들어간다.

왼쪽메뉴에서 [Build, Execution, Deployment] > [Compiler] 에서 ``Build project automatically`` 체크

![alt text](/public/img/IntelliJ_05.png)


# IntelliJ 불필요 import 제거

Ctrl + Alt + S 단축키로 Setting 화면에 들어간다.

왼쪽메뉴에서 [Editor] > [General] > [Auto Import] 에서 ``Optimize imports on the fly`` 체크

# Eclipse, IntelliJ, VSCode 단축키 비교

| 기능 | Eclipse | IntellJ | VSCODE |
| :---: | :---: | :---: | :---: |
| 블록 선택 | Alt + Shift + A　| Ctrl + Alt + Up(Dn) | Ctrl + Alt + Up(Dn) |
| 자동완성 | Ctrl + Space　| Ctrl + Space |  |
| Reformat, Code tidy | Ctrl + Shift + F | Ctrl + Alt + L | Ctrl + Alt + F |
| Quick Fix | Ctrl + 1 | Alt + Enter |  |
| View hierarchy| Ctrl + T | Ctrl + H |  |
| Find Usages | Ctrl + Shift + G | Alt + F7 |  |
| Find | Ctrl + F | Ctrl + F | Ctrl + F |
| Find next | Ctrl + K | F3 |  |
| Find previous | Ctrl + Shift + K | Shift + F3 |  |
| Replace | Ctrl + F | Ctrl + R |  |
| Find in path | Ctrl + H | Ctrl + Shift + F |  |
| 주석처리 | Ctrl + / | Ctrl + / | Ctrl + / |
| 주석제거 | Ctrl + / | Ctrl + / | Ctrl + / |
| 코드 한 줄 복사 | Ctrl + D | Ctrl + D | Alt + Shift + ↓ |
| expand/collapse |  | Ctrl + Shift + [+] or Ctrl + Shift + [-] | Alt + Shift + ↓ |

# IntelliJ VM 설정

IntelliJ 실행시 사용할 가상 머신의 인코딩 설정을 지정해 둔다.

본인의 IntelliJ설치 경로는 다음과 같다.
ex) C:\develop\tools\ideaIC-2022.3.1\bin

bin 하위 디렉토리의 .vmoptions파일을 연다.

```text
-Xms128m
-Xmx750m
-XX:ReservedCodeCacheSize=240m
-XX:+UseConcMarkSweepGC
-XX:SoftRefLRUPolicyMSPerMB=50
-ea
-XX:CICompilerCount=2
-Dsun.io.useCanonPrefixCache=false
-Djava.net.preferIPv4Stack=true
-Djdk.http.auth.tunneling.disabledSchemes=""
-XX:+HeapDumpOnOutOfMemoryError
-XX:-OmitStackTraceInFastThrow
-Djdk.attach.allowAttachSelf=true
-Dkotlinx.coroutines.debug=off
-Djdk.module.illegalAccess.silent=true

-Dfile.encoding=UTF-8
```

맨 아랫줄에 -Dfile.encoding=UTF-8 를 추가해준 후 저장한다.
이후 IntellJ를 다시 실행한다.

# IntelliJ 서버 기동시 속도 느림 현상

디버깅 모드로 서버를 기동할 때 디버깅 모드로 진입이 된되고 속도 느림 현상이 발견되었다.

디버깅 모드로 진입하면 메모리를 잡아 먹기 때문에 브레이크 포인트가 갑혀 있을 경우 진입을 못하게됨

이럴 때는 ``Ctrl + Shift + F8`` 를 눌러서 중단점을 제거한다.

# 이클립스 Ctrl + Shift + O in IntellJ IDEA

이클립스 상에서 CTRL + SHIFT + O 를 누르면 패키지를 자동으로 가져온다.

IntelliJ상에서 CTRL + ALT + O 를 누르면 사용하지 않는 이부 가져오기만 제거하고 어떤 패키지도 가져오지 않는다.

## 해결책

IDEA는 약간 다르게 작동하며 "unambiguous imports" 를 즉석에서 가져오고 이 기능을 수동으로 활성화 해야 한다.

- File > Settings > Editor > General > Auto import > Checked these options:

1. Add unambigous imports on the fly
2. Optimize imports on the fly