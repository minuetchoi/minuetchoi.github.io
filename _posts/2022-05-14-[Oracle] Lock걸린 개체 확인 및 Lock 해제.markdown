---
layout: post
title: "[Oracle] Lock걸린 개체 확인 및 Lock 해제"
date: 2022-05-14 12:00:00 +0900
category: oracle
---

# 1. 현재 Lock걸린 테이블 확인

```sql
SELECT A.SID
     , A.SERIAL#
     , object_name
     , A.SID || ', ' || A.SERIAL# AS KILL_TASK
  FROM V$SESSION A
 INNER JOIN V$LOCK B
    ON A.SID = B.SID
 INNER JOIN DBA_OBJECTS C
    ON B.ID1 = C.OBJECT_ID
 WHERE B.TYPE  = 'TM'
 ;

SID	SERIAL#	OBJECT_NAME	KILL_TASK
------------------------------------------------------------
401	12761	EMP		401, 12761
401	12761	EMP		401, 12761
 ;
```

# 2. SID와 시리얼 번호로 세션 해제

```sql
ALTER SYSTEM KILL SESSION '401, 12761';
```

# 3. Lock발생 사용자 및 OBJECT조회 + 어떤 sql를 실행중인지 확인

```sql
SELECT DISTINCT T1.SESSION_ID
     , T2.SERIAL#
     , T4.OBJECT_NAME
     , DECODE(T1.LOCKED_MODE
             ,0, 'LOCK요구중'
             ,1, 'NULL'
             ,2, '행공유(SS)'
             ,3, '행배타(SX)'
             ,4, '공유(S)'
             ,5, '공유행배타(SRX)'
             ,6, '배타(X)'
             ,'???' ) LOCKED_MODE_DEC
     , T2.MACHINE
     , T2.TERMINAL
     , T2.PROGRAM
     , T3.ADDRESS
     , T3.PIECE
     , T3.SQL_TEXT
  FROM V$LOCKED_OBJECT T1
     , V$SESSION T2
     , V$SQLTEXT T3
     , DBA_OBJECTS T4
 WHERE 1=1
   AND T1.SESSION_ID = T2.SID
   AND T1.OBJECT_ID = T4.OBJECT_ID
   AND T2.SQL_ADDRESS = T3.ADDRESS
   ORDER BY T3.ADDRESS, T3.PIECE
   ;
```


