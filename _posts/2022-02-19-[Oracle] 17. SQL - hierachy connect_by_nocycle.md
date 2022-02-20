---
layout: post
title: "[Oracle] 17. SQL - hierachy connect_by_nocycle"
date: 2022-02-19 14:00:00 +0900
category: oracle
---

# 1. connect_by_nocycle

connect by nocycle를 사용하면, 경로상에서 방문 끝난 노드에의 재방문을 막은 계층 조회를 한다.

### rosenMap

| id | nextId |
| :--- | :--- |
| 1 | 3 |
| 3 | 5 |
| 5 | null |
| 20 | 23 |
| 23 | 25 |
| 25 | 20 |


일단 nextId = id 를 조회조건으로 하고, start with id = 1 로 해서 조회한다.

```sql
select id,
       nextId,
       level,
       sys_connect_by_path(to_char(id), '-') as path
from   rosenMap
start with id = 1
connect by prior nextId = id;
```

### 출력결과

| id | nextId | level | path |
| :--- | :--- | :--- | :--- |
| 1 | 3 | 1 | -1 |
| 3 | 5 | 2 | -1-3 |
| 5 | null | 3 | -1-3-5 |

rosenMap 테이블을 보면 id가 25인 행에 nextId가 20이다

```sql
select id,
       nextId,
       level,
       sys_connect_by_path(to_char(id),'-') as path
from   rosenMap
start with id = 20
connect by prior nextId = id;
ERROR:
ORA-01436: CONNECT BY의 루프가 발생하였습니다.  라는 에러가 뜹니다.
```

이를 해결하기 위해 connect by nocycle를 사용한다.

```sql
select id,
       nextId,
       level,
       sys_connect_by_path(to_char(id), '-') as path,
       connect_by_iscycle as isCycle
from   rosenMap
start with id = 20
connect by nocycle prior nextID = id;
```

### 출력결과

| id | nextId | level | path | isCycle |
| :--- | :--- | :--- | :--- | :--- |
| 20 | 23 | 1 | -20 | 0 |
| 23 | 25 | 2 | -20-23 | 0 |
| 25 | 20 | 3 | -20-23-25 | 1 |


# 2. connect_by_iscycle 심층

### rosenMap2

| id | nextId1 | nextId2 |
| :--- | :--- | :--- |
| 1 | 2 | 3 |
| 2 | 4 | 5 |
| 3 | 4 | null |
| 4 | 2 | 6 |
| 5 | 6 | null |
| 6 | null | null |

상위행 nextId1 = 하위행 id 또는, 상위행 nextId2 = 하위행 id를

조건으로 하여, 같은 노드를 재방문하지 않고 조회해보자

```sql
select id,
       level,
       sys_connect_by_path(to_char(id), '-') as path,
       connect_by_iscycle as isCycle
from   rosenMap2
start with id = 1
connect by nocycle id in(prior nextID1, prior nextID2)
order by id, path;
```

### 출력결과

| id | level | path | isCycle |
| :--- | :--- | :--- | :--- |
| 1 | 1 | -1 | 0 |
| 2 | 2 | -1-2 | 0 |
| 2 | 4 | -1-3-4-2 | 1 |
| 3 | 2 | -1-3 | 0 |
| 4 | 3 | -1-2-4 | 1 |
| 4 | 3 | -1-3-4 | 0 |
| 5 | 3 | -1-2-5 | 0 |
| 5 | 5 | -1-3-4-2-5 | 0 |
| 6 | 4 | -1-2-4-6 | 0 |
| 6 | 4 | -1-2-5-6 | 0 |
| 6 | 6 | -1-3-4-2-5-6 | 0 |
| 6 | 4 | -1-3-4-6 | 0 |

isCycle은 재방문이 있는 경우 '1' 아니면 '0' 이다