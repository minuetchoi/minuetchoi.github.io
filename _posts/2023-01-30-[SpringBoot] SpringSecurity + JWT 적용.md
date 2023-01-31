---
layout: post
title: "[SpringBoot] SpringSecurity + JWT 적용"
date: 2023-01-30 15:20:23 +0900
category: springboot
---

출처: 오늘의 기록 danuri


# JWT

JWT (Json Web Token) 은 일반적으로 클라이언트와 서버 통신 시 권한 인가 (Authorization)을 위해 사용하는 토큰이다.

현재 앱 개발을 위해 REST API를 사용 중인데, 웹 상에서 Form 을 통해 로그인하는 것이 아닌, API 접근을 위해 프론트엔트에게 인증 토큰을 발급하고 싶을 때, 적절한 인증 수단이라고 생각해서 이를 Spring Security와 함께 적용해 보려한다.

Spring Security + JWT 의 동작과정을 살펴보자

![alt text](/public/img/springboot_12.png)

기본 동작 원리는 간단하다.

1. 클라이언트에서 ID/PW를 통해 로그인을 요청한다.

1. 서버에서 DB에 해당하는 ID/PW를 가진 User가 있다면, Access Token 과 Refresh Token을 발급해준다.

1. 클라이언트는 발급받은 Access Token을 헤더에 담아서 서버가 허용한 API를 사용할 수 있게 된다.

여기서 Refresh Token은 새로운 Access Token을 발급하기 위한 토큰이다.

기본적으로 Access Token은 외부 유출문제로 인해 유효기간을 짧게 설정하는데, 정상적인 클라이언트 유효기간이 끝난 Access token에 대해 Refresh Token을 사용하여 새로운 Access Token을 발급받을 수 있다.

따라서, Refresh token의 유효 기간은 Access Token의 유효기간보다 길게 설정해야 한다고 생각할 수 있다.

그런데, 만약 Refresh token이 유출되어서 다른 사용자가 이를 통해 새로운 Access Token을 발급받았다면 이 경우, Access Token의 충돌이 발생하기 때문에 서버측에서는 두 토큰을 모두 폐기시켜야 한다.

국제 인터넷 표준화 기구 (IETF)에서는 이를 방지하기 위해 Refresh token도 Access Token과 같은 유효 기간을 가지도록 하여, 사용자가 한번 Refresh Token으로 Access Token을 발급 받았으면, refresh Token도 다시 발급 받도록 하는 것을 권장하고 있다.

새로운 Access Token + Refresh Token에 대한 재발급 원리는 다음과 같다.

![alt text](/public/img/springboot_13.png)

# 코드

이제 위 과정들을 구현하기 위한 코드를 작성해보자.

build.gradle

```gradle
// 스프링 시큐리티
implementation 'org.springframework.boot:spring-boot-starter-security:3.0.1'
// jwt
implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
implementation 'io.jsonwebtoken:jjwt-impl:0.11.5'
implementation 'io.jsonwebtoken:jjwt-jackson:0.11.5'
```

# 토큰 정보를 보내기 위해 응답 클래스를 생성한다.

```java
package com.example.vuebackboard.api.model;

import com.example.vuebackboard.api.util.StringUtils;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.apache.commons.collections4.map.ListOrderedMap;

@Data
@RequiredArgsConstructor
public class Response extends ListOrderedMap<Object, Object> {

    public Object put(Object key, Object value) {
        return super.put(StringUtils.toCamelCase((String) key), value);
    }
}
```



# JwtTokenProvider

JWT 토큰 생성, 토큰 복호화 및 정보 추출, 토큰 유효성 검증의 기능이 구현된 클래스이다.

application.yml에 다음 설정을 추가한다.

```yaml
jwt:
  secret: VlwEyVBsYt9V7zq57TejMnVUyzblYcfPQye08f7MGVA9XkHa
```

토큰의 암호화 복호화를 위한 secret key 로써 이후 HS256 알고리즘을 사용하기 위해, 256비트보다 커야한다.

알파벳은 한단어당 8bit이므로 32글자 이상이면 된다.

다음은 JwtTokenProvider 코드이다.


```java
package com.example.vuebackboard.api.config.jwt;


import com.example.vuebackboard.api.model.Response;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Arrays;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

@Slf4j
@Component
public class JwtTokenProvider {

    private final Key key;

    public JwtTokenProvider(@Value("${jwt.secret}") String secretKey) {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    // 유저 정보를 가지고 AccessToken, RefreshToken을 생성하는 메서드
    public Response generateToken(Authentication authentication) {
        // 권한 가져오기
        String authorities = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.joining(","));
        long now = (new Date()).getTime();
        // Access Token 생성
        Date accessTokenExpiresIn = new Date(now + 86400000);
        String accessToken = Jwts.builder().setSubject(authentication.getName()).claim("auth", authorities).setExpiration(accessTokenExpiresIn).signWith(key, SignatureAlgorithm.HS256).compact();
        // Refresh Token 생성
        String refreshToken = Jwts.builder().setExpiration(new Date(now + 86400000)).signWith(key, SignatureAlgorithm.HS256).compact();

        Response response = new Response();
        response.put("grantType", "Bearer");
        response.put("accessToken", accessToken);
        response.put("refreshToken", refreshToken);

        return response;
    }

    // JWT 토큰을 복호화하여 토큰에 들어있는 정보를 꺼내는 메서드
    public Authentication getAuthentication(String accessToken) {
        // 토큰 복호화
        Claims claims = parseClaims(accessToken);

        if (claims.get("auth") == null) {
            throw new RuntimeException("권한 정보가 없는 토큰입니다.");
        }

        // 클레임에서 권한 정보 가져오기
        Collection<? extends GrantedAuthority> authorities = Arrays.stream(claims.get("auth").toString().split(",")).map(SimpleGrantedAuthority::new).collect(Collectors.toList());
        // UserDetails 객체를 만들어서 Authentication 리컨
        UserDetails principal = new User(claims.getSubject(), "", authorities);
        return new UsernamePasswordAuthenticationToken(principal, "", authorities);
    }

    // 토큰 정보를 검증하는 메서드
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (io.jsonwebtoken.security.SecurityException | MalformedJwtException e) {
            log.info("Invalid JWT Token", e);
        } catch (ExpiredJwtException e) {
            log.info("Expired JWT Token", e);
        } catch (UnsupportedJwtException e) {
            log.info("Unsupported JWT Token", e);
        } catch (IllegalArgumentException e) {
            log.info("JWT claims string is empty.", e);
        }
        return false;
    }

    private Claims parseClaims(String accessToken) {
        try {
            return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(accessToken).getBody();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }
}
```

Date 생성자에 삽입하는 숫자 86400000는 토큰의 유효기간으로써 1일을 나타낸다.

보통 토큰은 30분 정도로 생성하는데, 테스트를 위해 1일로 설정했다.

``1일:24 * 60 * 60 * 1000``

# JwtAuthenticationFilter

클라이언트 요청 시 JWT 인증을 하기 위해 설치하는 커스텀 필터로 UsernamePasswordAuthenticationFilter 이전에 실행된다.

이전에 실행된다는 뜻은 JwtAuthenticationFilter를 통과하면 UsernamePasswordAuthenticationFilter 이후의 필터는 통과한 것으로 본다는 것이다.

쉽게 말해서, Username + Password를 통한 인증을 Jwt를 통해 수행한다는 것이다.


```java
package com.example.vuebackboard.api.config.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.GenericFilterBean;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends GenericFilterBean {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {

        // 1. Request Header 에서 JWT 토큰 추출
        String token = resolveToken((HttpServletRequest) request);

        // 2. validateToken 으로 토큰 유효성 검사
        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 토큰이 유효할 경우 토큰에서 Authentication 객체를 가지고 와서 SecurityContext에 저장
            Authentication authentication = jwtTokenProvider.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }
        chain.doFilter(request, response);
    }

    // Request Header에서 토큰 정보 추출
    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}

```

# SecurityConfig

Spring Security 설정을 위한 클래스이다.


```java
package com.example.vuebackboard.api.config.web;


import com.example.vuebackboard.api.config.jwt.JwtAuthenticationFilter;
import com.example.vuebackboard.api.config.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@RequiredArgsConstructor
@EnableWebSecurity
@Configuration
public class SecurityConfig {


    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .httpBasic().disable()
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()
            .requestMatchers("/board/**").permitAll()
            .requestMatchers("/users/login").permitAll()
            //.requestMatchers("/users/test").hasRole("USER")
            .requestMatchers("/users/test").hasAnyRole("ADMIN", "USER")
            .anyRequest().authenticated()
            .and()
            .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
```

과거에는 Security 설정을 WebSecurityConfigurerAdapter 클래스를 상속받아서 구현했지만, SpringBoot 버전이 올라가면서 해당 방식은 Deprecated되었다.

따라서 이제는 빈 등록을 통해 Security를 설정한다.

복잡해보이지만 단순하다.

1. httpBasic().disable().csrf().disable(): rest api이므로 basic auth및 csrf보안을 사용하지 않는다는 설정이다.

1. sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS): JWT를 사용하기 때문에 세션을 사용하지 않는다는 설정이다.

1. ``requestMatchers("/users/login").permitAll()``: 해당 API에 대해서는 모든 요청을 허가한다는 설정이다.

1. ``requestMatchers("/users/test").hasRole("USER")``: USER권한이 있어야 요청할 수 있다는 설정이다.

1. ``anyRequest().authenticated()``: 이 밖에 모든 요청에 대해서는 인증을 필요로 한다는 설정이다.

1. addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticaionFilter.class): JWT 인증을 위해서 직접 구현한 필터를 UsernamePasswordAuthenticationFilter전에 실행하겠다는 설정이다.

1. passwordEncoder: JWT를 사용하기 위해서는 기본적으로 password encoder가 필요한데, 여기서는 Bycrypt encoder를 사용했다.

# User

인증을 도울 도메인을 만들자.

```java
package com.example.vuebackboard.api.config.web.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    private String userId;

    private String password;

    @Builder.Default
    private List<String> roles = new ArrayList<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.roles.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return false;
    }

    @Override
    public boolean isAccountNonLocked() {
        return false;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return false;
    }

    @Override
    public boolean isEnabled() {
        return false;
    }
}
```

# UserMapper

```java
package com.example.vuebackboard.api.repository;

import com.example.vuebackboard.api.model.Request;
import com.example.vuebackboard.api.model.Response;
import org.apache.ibatis.annotations.Mapper;
import org.springframework.stereotype.Repository;

@Mapper
@Repository
public interface UserMapper {

    Response findUserByUserId(Request request);
}
```


# MemberService

여기서 login 메서드를 구현한다.

```java
package com.example.vuebackboard.api.config.web.service;

import com.example.vuebackboard.api.config.jwt.JwtTokenProvider;
import com.example.vuebackboard.api.model.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UserService {

    private final AuthenticationManagerBuilder authenticationManagerBuilder;

    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public Response login(String userId, String password) {
        // 1. Login ID/PW를 기반으로 Authentication 객체 생성
        // 이때 authentication는 인증 여부를 확인하는 authenticationed 값이 fasle
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(userId, password);
        // 2. 실제 검증 (사용자 비밀번호 체크)이 이루어지는 부분
        // authenticate 메서드가 실행될 때 CustomUserDetailsService에서 만든 loadUserByUsername 메서드가 실행
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);
        // 3. 인증정보를 기반으로 JWT 토큰 생성
        return jwtTokenProvider.generateToken(authentication);
    }
}
```

로그인 과정은 크게 3단계이다.

1. 로그인 요청으로 들어온 memberId, password를 기반으로 Authentiation 객체를 생성한다.

1. authenticate() 메서드를 통해 요청된 User에 대한 검증이 진행된다.

1. 검증이 정상적으로 통과되었다면 인증된 Authentication 객체를 기반으로 JWT 토큰을 생성한다.

2번 과정에서 중요하게 볼 것은 주석에도 달았듯이, loadUserByUsername 메서드를 실행한다는 것이다.
해당 메서드는 검증을 위한 유저 객체를 가져오는 부분으로써, 어떤 객체를 검증할 것인지에 대해 직접 구현해주어야 한다.

# CustomUserDetailsService

```java
package com.example.vuebackboard.api.config.web.service;


import com.example.vuebackboard.api.model.Request;
import com.example.vuebackboard.api.model.Response;
import com.example.vuebackboard.api.repository.UserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserMapper userMapper;

    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Request request = new Request();
        request.put("username", username);

        Response response = userMapper.findUserByUserId(request);

        if (response == null) {
            new UsernameNotFoundException("해당하는 유저를 찾을 수 없습니다.");
        }

        return createUserDetails(response);
    }

    private UserDetails createUserDetails(Response response) {
        String username = (String) response.get("username");
        String password = (String) response.get("password");
        return User.builder().username(username)
            .password(passwordEncoder.encode(password))
            .roles(new String[]{"ADMIN", "USER"}).build();
    }
}

```

여기서 PasswordEncoder를 통해 UserDetails객체를 생성할 때 encoding 을 해줬다.

왜냐하면 Spring Security는 사용자 검증을 위해 encoding된 password와 그렇지 않은 password를 비교하기 때문이다.

실제로는 DB자체에 encoding 된 password값을 갖고 있고 그냥 user.getPassword()로 encoding된 password를 꺼내는 것이 좋지만 , 예제의 편의를 위해 검증 객체를 생성할 때 encoding을 해줬다.

# UserController

```java
package com.example.vuebackboard.api.controller;


import com.example.vuebackboard.api.model.Request;
import com.example.vuebackboard.api.model.Response;
import com.example.vuebackboard.api.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    @PostMapping("login")
    public Response login(@RequestBody Request request) {

        String userId = (String) request.get("userId");
        String password = (String) request.get("password");

        return userService.login(userId, password);
    }

    @PostMapping("/test")
    public String test() {
        return "success";
    }
}
```

Postman을 테스트를 진행한다.

![alt text](/public/img/springboot_14.png)


```json
{
    "granttype": "Bearer",
    "accesstoken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImF1dGgiOiJST0xFX0FETUlOLFJPTEVfVVNFUiIsImV4cCI6MTY3NTIzODY2Mn0.LUr3rkG0JI4IMWBN_Sy956qznDOfOIlCea-tHUfFm5E",
    "refreshtoken": "eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjE2NzUyMzg2NjJ9.q58EjIO230ubOdAny3552EymdULce4XSuRDeR4IshXA"
}
```

Access Token과 Refresh Token이 잘 생성된 것을 볼 수 있다.

이제 Access Token을 복사해서 다른 API를 호출해보자

![alt text](/public/img/springboot_15.png)


만약, 토큰을 한굴자 지워보거나 변경하면 해당 API에 접근할 수 없게 된다.

# SecurityUtil

추가로 Spring Security를 사용하면 편리하게 사용할 수 있는 코드를 소개한다.

API 호출 시, 사용자 정보가 헤더에 담겨져 올텐데 어떤 유저가 API를 요청했는지 조회하는 코드이다.

```java
package com.example.vuebackboard.api.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class SecurityUtil {

    public static String getCurrentUserId() {
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication.getName();
    }
}
```