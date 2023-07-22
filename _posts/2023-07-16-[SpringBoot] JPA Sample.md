---
layout: post
title: "[SpringBoot] JPA Sample"
date: 2023-07-17 12:00:00 +0900
category: springboot
---

# [출처: 부부개발단]

# [소스]

![alt text](/public/img/springboot_16.png)

Board.java
```java
package com.example.springdatajpa.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "board")
@NoArgsConstructor
@Setter
@Getter
public class Board {

    @Id
    @Column(name = "board_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer boardId;

    @Column(length = 100)
    private String title;

    @Lob
    private String content; // text type

    private int viewCnt;

    @CreationTimestamp
    private LocalDateTime regdate;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Override
    public String toString() {
        return "Board{" +
                "boardId=" + boardId +
                ", title='" + title + '\'' +
                ", content='" + content + '\'' +
                ", viewCnt=" + viewCnt +
                ", regdate=" + regdate +
                ", user=" + user +
                '}';
    }
}
```

User.java
```java
package com.example.springdatajpa.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity // Database Table과 맵핑하는 객체.
@Table(name = "user") // Database 테이블 이름 user3 와 User라는 객체가 맵핑.
@NoArgsConstructor // 기본생성자가 필요하다.
@Setter
@Getter
public class User {
    @Id // 이 필드가 Table의 PK.
    @Column(name = "user_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY) // userId는 자동으로 생성되도록 한다. 1,2,3,4
    private Integer userId;

    @Column(length = 255)
    private String email;

    @Column(length = 50)
    private String name;

    @Column(length = 500)
    private String password;

    @CreationTimestamp // 현재시간이 저장될 때 자동으로 생성.
    private LocalDateTime regdate;

    @ManyToMany
    @JoinTable(name = "user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", email='" + email + '\'' +
                ", name='" + name + '\'' +
                ", password='" + password + '\'' +
                ", regdate=" + regdate +
                '}';
    }
}
```

Role.java
```java
package com.example.springdatajpa.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.persistence.*;

@Entity
@Table(name="role")
@NoArgsConstructor
@Setter
@Getter
public class Role {
    @Id
    @Column(name="role_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roleId;

    @Column(length = 20)
    private String name;

    @Override
    public String toString() {
        return "Role{" +
                "roleId=" + roleId +
                ", name='" + name + '\'' +
                '}';
    }
}
```

UserRepository.java
```java
package com.example.springdatajpa.repository;

import com.example.springdatajpa.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Integer> {

}
```

RoleRepository.java
```java
package com.example.springdatajpa.repository;

import com.example.springdatajpa.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Integer> {
}
```

BoardRepository.java
```java
package com.example.springdatajpa.repository;

import com.example.springdatajpa.domain.Board;
import com.example.springdatajpa.dto.BoardIf;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BoardRepository extends JpaRepository<Board, Integer> {

    // JPQL를 사용할 수 있다.
    // JPQL은 sql 과 모양이 비슷하지만, sql이 아니다.
    // JPQL은 객체지향 언어이다.
    @Query(value = "select b from Board b")
    Optional<List<Board>> getBoards();

    // ⇒ 1:N 불가능
    @Query(value = "select b from Board b join b.user")
    Optional<List<Board>> getBoardz();

    // Fatch 를 붙여주게 되면 한번에 user컬럼까지 모두 가져온다. good!
    // Entity에 FetchType을 EAGER나 LAZY를 하더라도 무방함 ⇒ 1:N 가능
    @Query(value = "select b from Board b join fetch b.user")
    Optional<List<Board>> getBoardzz();

    // 일반조인을 할 수도 있다. ⇒ 1:N 불가능
    @Query(value = "select b from Board b join fetch User u on b.user.userId = u.userId")
    Optional<List<Board>> getBoardss();

    @Query(value = "select count(b) from Board b")
    Long getBoardCount();

    // 권한에 해당하는 사람이 쓴 글만 목록을 구하는 JPQL를 구한다.
    // select * from board b, user u, user_role ur, role r where b.user_id = u.user_id
    //     and u.user_id = ur.user_id and ur.role_id = r.role_id and r.name = ?
    @Query(value = "select b from Board b inner join fetch b.user u inner join u.roles r where r.name = :roleName")
    List<Board> getBoards(@Param("roleName") String roleName);

    // Fetch를 빼고 select 뒤어 b,u,r를 지정하면 전부 나온다.
    @Query(value = "select b, u, r from Board b inner join b.user u inner join u.roles r where r.name = :roleName")
    List<Board> getBoardsz(@Param("roleName") String roleName);

    // Native Query

    @Query(value = "select b.board_id, b.title, b.content, b.user_id, u.name, b.regdate, b.view_cnt from board b, user u where b.user_id = u.user_id;", nativeQuery = true)
    List<BoardIf> getBoardWithNativeQuery();
}
```

BoardIf.java
```java
package com.example.springdatajpa.dto;

import java.time.LocalDateTime;

public interface BoardIf {

    Integer getBoardId();

    String getTitle();

    String getContent();

    Integer getUserId();

    String getName();

    LocalDateTime getRegdate();

    int getViewCnt();
}
```

SpringdatajpaApplication.java
```java
package com.example.springdatajpa;

import com.example.springdatajpa.dto.BoardIf;
import com.example.springdatajpa.repository.BoardRepository;
import com.example.springdatajpa.repository.RoleRepository;
import com.example.springdatajpa.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@SpringBootApplication
public class SpringdatajpaApplication implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(SpringdatajpaApplication.class, args);
    }

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;

    @Autowired
    BoardRepository boardRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
//        List<User> userList = userRepository.findAll();
//        userList.stream().forEach(user -> user.getRoles().stream().forEach(role -> System.out.println(role.toString())));
//
//        List<Board> boardList = boardRepository.findAll();
//        System.out.println(11);

//        Optional<List<Board>> boardList = boardRepository.getBoards();
//        boardList.stream().forEach(board -> System.out.println(board.toString()));

//        Optional<List<Board>> boardList = boardRepository.getBoardz();
//        boardList.stream().forEach(board -> System.out.println(board.toString()));

//        Optional<List<Board>> boardList = boardRepository.getBoardzz();
//        boardList.stream().forEach(board -> System.out.println(board.toString()));

//        Long boardCount = boardRepository.getBoardCount();

//        Role role = roleRepository.findById(2).get();
//        System.out.println(role);

        // start
//        User user = new User();
//        user.setName("관리자");
//        user.setPassword("1234");
//        user.setEmail("admin@example.com");
//        user.setRegdate(LocalDateTime.now());
//        user.setRoles(Set.of(role));
//
//        userRepository.save(user);
        // end

        // start
//        User user = userRepository.findById(1).get();
//        Board board = new Board();
//        board.setUser(user);
//        board.setRegdate(LocalDateTime.now());
//        board.setTitle("관리자님의 글");
//        board.setContent("내용입니다.");
//
//        boardRepository.save(board);
        // end

        // start
//        List<Board> list = boardRepository.getBoards("ROLE_ADMIN");
//        list.stream().forEach(board -> System.out.println(board.toString()));
        // end

        // start
        List<BoardIf> list = boardRepository.getBoardWithNativeQuery();
        list.stream().forEach(boardIf -> System.out.println(boardIf.getName()));
        // end

    }

}
```