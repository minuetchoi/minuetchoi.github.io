---
layout: post
title: "[SpringBoot] JPA Query Method"
date: 2023-07-16 12:00:00 +0900
category: springboot
---

# [공식문서]

[https://docs.spring.io/spring-data/jpa/docs/current/reference/html/#jpa.query-methods.query-creation](query method reference){:target="_blank"}


# 소스

application.yml
```yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/jpa?serverTimezone=UTC&characterEncoding=UTF-8
    username: root
    password: 1234
  jpa:
    hibernate:
      ddl-auto: update #자동으로 테이블을 만들어줌
    properties:
      hibernate:
        show_sql: true
        format_sql: true
    database-platform: org.hibernate.dialect.MySQL8Dialect
```

SpringdatajpaApplication.java
```java
package com.example.springdatajpa;

import com.example.springdatajpa.domain.User;
import com.example.springdatajpa.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import javax.persistence.EntityManagerFactory;
import javax.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@SpringBootApplication
// 스프링에서 제공해주는 빈을 사용하러면 CommandLineRunner 를 implement한다.
public class SpringdatajpaApplication implements CommandLineRunner {

    @Autowired
    EntityManagerFactory entityManagerFactory;

    @Autowired
    UserRepository userRepository; // UserRepository를 구현하고 있는 Bean을 자동으로 Inject(주입) 해준다.

    public static void main(String[] args) {
        SpringApplication.run(SpringdatajpaApplication.class, args);
    }

    @Override
    // 메서드가 시작할 때 트랜잭션이 실행되고, 메소드가 종료될 때 트랜잭션이 commit;
    //
    @Transactional
    public void run(String... args) throws Exception {
//        System.out.println(userRepository.getClass().getName());
//        User user = userRepository.findById(1).orElseThrow();
//        System.out.println(user);

//        User user = new User();
//        user.setName("둘리3");
//        user.setEmail("d3@example.com");
//        user.setPassword("1234");
//        user.setRegdate(LocalDateTime.now());
//
//        userRepository.save(user);

        // delete
//        userRepository.deleteById(13);

        // delete2
//        userRepository.findById(14).orElseThrow();
//        userRepository.delete(user);

        // update
//        User user = userRepository.findById(1).orElseThrow();
//        System.out.println(user);
//        user.setPassword("9999");

//        User user = new User();
//        user.setName("둘리4");
//        user.setEmail("d4@example.com");
//        user.setPassword("1234");
//        user.setRegdate(LocalDateTime.now());
//
//        User saveUser = userRepository.save(user);
//        // user의 userId가 궁금?
//        System.out.println(saveUser);
//        if (user == saveUser) {
//            System.out.println("user == saveUser");
//        } else {
//            System.out.println("user != saveUser");
//        }

//        User user = userRepository.findByName("둘리4").orElseThrow();
//        System.out.println(user.toString());

        Optional<User> user = userRepository.findByNameAndEmail("둘리4", "d4@example.com");
        Optional<List<User>> list01 = userRepository.findByNameOrEmail("둘리3", "d4@example.com");
        Optional<List<User>> list02 = userRepository.findByUserIdBetween(1, 100);
        Optional<List<User>> list03 = userRepository.findByUserIdLessThan(100);
        Optional<List<User>> list04 = userRepository.findByUserIdLessThanEqual(100);
        Optional<List<User>> list05 = userRepository.findByUserIdGreaterThan(0);
        Optional<List<User>> list06 = userRepository.findByUserIdGreaterThanEqual(0);
        Optional<List<User>> list07 = userRepository.findByRegdateAfter(LocalDateTime.now().minusDays(2L));
        Optional<List<User>> list08 = userRepository.findByNameIsNull();
        Optional<List<User>> list09 = userRepository.findByNameLike("%길동");
        Optional<List<User>> list10 = userRepository.findByNameLike("홍");
        Optional<List<User>> list11 = userRepository.findByNameLike("%길%");
        Optional<List<User>> list12 = userRepository.findByNameStartingWith("홍");
        Optional<List<User>> list13 = userRepository.findByNameEndingWith("길동");
        Optional<List<User>> list14 = userRepository.findByNameContaining("길동");
        Optional<List<User>> list15 = userRepository.findByOrderByNameAsc();
        Optional<List<User>> list16 = userRepository.findByRegdateBeforeOrderByName(LocalDateTime.now().plusDays(2L));
        Optional<List<User>> list17 = userRepository.findByNameNot("홍길동");
        Optional<List<User>> list18 = userRepository.findByUserIdIn(List.of(2, 3));
        Optional<List<User>> list19 = userRepository.findByUserIdNotIn(List.of(2, 3));
        Optional<Long> count1 = userRepository.countBy();
        Optional<Long> count2 = userRepository.countByNameLike("홍길동");
        Optional<Boolean> exist = userRepository.existsByEmail("d4@example.com");
        Optional<Integer> delete = userRepository.deleteByName("홍길동");
        Optional<List<User>> list20 = userRepository.findDistinctByNameLike("홍길동");
        Optional<List<User>> list21 = userRepository.findFirst2By();
        Optional<List<User>> list22 = userRepository.findTop2By();
        Optional<Page<User>> list23 = userRepository.findBy(PageRequest.of(0, 2, Sort.by(Sort.Direction.DESC, "regdate")));
        Optional<Page<User>> list24 = userRepository.findByName("홍길동", PageRequest.of(0, 2, Sort.by(Sort.Direction.DESC, "regdate")));
    }
}
/*
    @Override
    public void run(String... args) throws Exception {
        EntityManager entityManager = entityManagerFactory.createEntityManager();
        EntityTransaction transaction = entityManager.getTransaction();

        try {
            transaction.begin();
            // jpa관련 코드

//            User user = new User();
//            user.setName("하하하_1");
//            user.setEmail("urstore_1@gmail.com");
//            user.setPassword("1234_1");
//            entityManager.persist(user);

            // 삭제
//            User user = entityManager.find(User.class, 2);
//            entityManager.remove(user);

            User user = entityManager.find(User.class, 1);
            User user2 = entityManager.find(User.class, 1);

            user.setPassword("5678");

            transaction.commit();
        } catch (Exception e) {
            transaction.rollback();
        } finally {
            entityManager.close();
        }
    }
}
*/
```

User.java
```java
package com.example.springdatajpa.domain;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user3")
@NoArgsConstructor // 기본 생성자가 있어야 한다.
@Setter
@Getter
@ToString // ToString은 조심히 만들어야 한다.
public class User {

    @Id
    @Column(name = "user_id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer userId;

    @Column(length = 255)
    private String email;

    @Column(length = 50)
    private String name;

    @Column(length = 500)
    private String password;

    @CreationTimestamp // 현재시간이 저장될 때 자동으로 생성
    private LocalDateTime regdate;
}
```

UserRepository.java
```java
package com.example.springdatajpa.repository;

// org.springframework.data.jpa.repository.JpaRepository;

import com.example.springdatajpa.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

// Spring Data JPA Repository를 완성!
// 보통 인터페이스를 선언하면? 인터페잇를 구현하는 클래스를 작성해야지?
// Spring Data JPA는 마법을 부린다.
// UserRepository를 구현하는 Bean을 자동을 생성한다.
public interface UserRepository extends JpaRepository<User, Integer> {

    // 이름으로 조회할 때는 Query method를 이용한다.
    Optional<User> findByName(String name);

    // where name = ? and email = ?
    Optional<User> findByNameAndEmail(String name, String email);

    // where name like ? or email = ?
    Optional<List<User>> findByNameOrEmail(String name, String email);

    // where user_id between ? and ?
    Optional<List<User>> findByUserIdBetween(int startUserId, int endUserId);

    // where user_id < ?
    Optional<List<User>> findByUserIdLessThan(int userId);

    // where user_id <= ?
    Optional<List<User>> findByUserIdLessThanEqual(int userId);

    // where user_id > ?
    Optional<List<User>> findByUserIdGreaterThan(int userId);

    // where user_id >= ?
    Optional<List<User>> findByUserIdGreaterThanEqual(int userId);

    // where regdate > ?
    Optional<List<User>> findByRegdateAfter(LocalDateTime day);

    // where regdate < ?
    Optional<List<User>> findByRegdateBefore(LocalDateTime day);

    // where name is null
    Optional<List<User>> findByNameIsNull();

    // where name is not null
    Optional<List<User>> findByNameIsNotNull();

    // where name like ?
    Optional<List<User>> findByNameLike(String name);

    // where name like? // 파라미터로 들어온 이름 뒤에 %가 자동으로 붙는다.
    Optional<List<User>> findByNameStartingWith(String name);

    Optional<List<User>> findByNameEndingWith(String name);

    // where name like ? => '%이름%'
    Optional<List<User>> findByNameContaining(String name);

    // order by name asc
    Optional<List<User>> findByOrderByNameAsc();

    Optional<List<User>> findByRegdateBeforeOrderByName(LocalDateTime day);

    // where name <> ?
    Optional<List<User>> findByNameNot(String name);

    // where user_id in (...)
    Optional<List<User>> findByUserIdIn(Collection<Integer> userIds);

    // where user_id not in (...)
    Optional<List<User>> findByUserIdNotIn(Collection<Integer> userIds);

    // select count(*) from user3
    Optional<Long> countBy();

    // select count(*) from user3 where name like ?
    Optional<Long> countByNameLike(String name);

    Optional<Boolean> existsByEmail(String email);

    Optional<Integer> deleteByName(String name);

    Optional<List<User>> findDistinctByNameLike(String name);

    // select * from user3 limit 2
    Optional<List<User>> findFirst2By();

    Optional<List<User>> findTop2By();

    Optional<Page<User>> findBy(Pageable pageable);

    Optional<Page<User>> findByName(String name, Pageable pageable);

    Optional<Page<User>> findByNameContaining(String name, Pageable pageable);

    Optional<Page<User>> findByNameContainingOrEmailContaining(String name, String email, Pageable pageable);
}
```