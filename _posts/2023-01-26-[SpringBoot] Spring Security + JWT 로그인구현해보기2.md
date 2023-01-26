---
layout: post
title: "[SpringBoot] Spring Security + JWT 로그인구현해보기1"
date: 2023-01-26 19:00:00 +0900
category: springboot
---

[modsiw.log 님](https://velog.io/@modsiw/Spring-Spring-Security-JWT-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EC%98%88%EC%A0%9C-2){:target="_blank"} 

이제 필요한 모든 보안 구성이 완료되었습니다.

드디어 로그인 및 가입 API를 작성할 시간입니다.

그러나 API를 정의하기 전에 API가 사용할 요청 및 응답 페이로드 (DTO)를 정의해야 합니다.
먼저 이러한 페이로드를 정의해보겠습니다.

# 페이로드 요청(DTO) 클래스

## 1. 로그인 요청 (Request)

```java
package com.example.polls.payload;

import javax.validation.constraints.NotBlack;

public class LoginRequest {

    @NotBlank
    private String usernameOrEmail;

    @NotBlack
    private String password;

    public String getUsernameOrEmail() {
        return usernameOrEmail;
    }

    public void setUsernameOrEmail(String usernameOrEmail) {
        this.usernameOrEmail = usernameOrEmail;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
```

## 2. 회원가입요청 (Request)

```java
import javax.validation.constraints.*;

@Getter
@Setter
public class SignUpRequest {
    @NotBlank
    @Size(min = 4, max = 40)
    private String name;

    @NotBlank
    @Size(min = 3, max = 15)
    private String username;

    @NotBlank
    @Size(max = 40)
    @Email
    private String email;

    @NotBlank
    @Size(min = 6, max = 20)
    private String password;
}
```

# 응답 Response payload(DTO)

## 1. JWT인증 응답 (Response)

```java
@Getter
@Setter
public class JwtAuthenticationResponse {
    private String accessToken;
    private String tokenType = "Bearer";

    public JwtAuthenticationResponse(String accessToken) {
        this.accessToken = accessToken;
    }
}
```

## 2. APIResponse

```java
@Getter
@Setter
public class ApiResponse {
    private Boolean success;
    private String message;

    public ApiResponse(Boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}
```

# 예외 작성

요청이 유효하지 않거나 예상치 못한 상황이 발생하면 API에서 예외가 발생합니다.

또한 다양한 유형의 예외에 대해 다른 HTTP 상태 코드로 응답하기를 원할 것입니다.

exception 이라는 패키지를 생성하여 exception 을 작성하자.

## 1. AppException

```java
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class AppException extends RuntimeException {
    public AppException(String message) {
        super(message);
    }

    public AppException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## 2. BadRequestException

```java
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
```

## 3. ResourceNotFoundException

```java
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {
    private String resourceName;
    private String fieldName;
    private Object fieldValue;

    public ResourceNotFoundException( String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s : '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public String getResourceName() {
        return resourceName;
    }

    public String getFieldName() {
        return fieldName;
    }

    public Object getFieldValue() {
        return fieldValue;
    }
}
```