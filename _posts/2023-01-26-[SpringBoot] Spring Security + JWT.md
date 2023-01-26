---
layout: post
title: "[SpringBoot] Spring Security + JWT"
date: 2023-01-26 12:00:00 +0900
category: springboot
---

[modsiw.log 님](https://velog.io/@modsiw/Spring-Spring-Security%EC%99%80-JWT-%EA%B0%9C%EB%85%90){:target="_blank"} 

# Spring Security란?

Spring Security는 강력한 사용자 인증 및 Access 제어 framework이다.

이는 Java 애플리케이션에 인증 및 권한 부여를 제공하는데 중점을 두었으며 다양한 필터를 사용하여 커스터마이징이 가능하다.

# Filter Chain

Spring Security는 표준 서블릿 필터를 사용한다.

다른 요청들과 마찬가지로 HttpServletRequest 와 HttpServletResponse 를 사용한다.

Spring Security는 서비스 설정에 따라 필터를 내부적으로 구성한다.

각 필터는 각자 역할이 있고 필터 사이의 종속성이 있으므로 순서가 중요하다

XML Tag를 이용한 네임스페이스 구성을 사용하는 경우 필터가 자동으로 구성되지만, 네임스페이스 구성이 지원하지 않는 기능을 써야하거나 커스터마이징된 필터를 사용해야 할 경우 명시적으로 빈을 등록할 수 있다.

클라이언트가 요청을 하면 DelegatingFilterProxy가 요청을 가로채고 Spring Security의 빈으로 전달한다.

이 DelegatingFilterProxy가 web과 applicationContext 사이의 링크를 제공한다.

그러니까 DelegatingFilterProxy는 한마디로 Spring의 애플리케이션 컨텍스트에서 얻는 Filter Bean을 대신 실행한다.

그러니 이 Bean은 java.servlet.Filter를 구현해야 한다.

이 포스팅에서는 jwtAuthenticationFilter 가 된다.

Spring Security Filter Chain은 아래와 같이 다양하며 커스터마이징이 가능하다.

![alt text](/public/img/springboot_12.png)

- SecurityContextPersistentFilter: SecurityContextRepository에서 SecurityContext를 가져와서 SecurityContextHolder에 주입하거나 반대로 저장하는 역할을 합니다.
- LogoutFilter: logout 요청을 감시하며, 요청시 인증 주체 (Principal)를 로그아웃 시킵니다.
- UsernamePasswordAuthenticationFilter: Login 요청을 감시하며, 인증과정을 진행합니다.
- DefaultLoginPageGenerationFilter: 사용자가 별도의 로그인페이지를 구현하지 않은 경우, 스프링에서 기본적으로 설정한 로그인 페이지로 넘어가게 합니다.
- BasicAuthenticationFilter: HTTP요청의 (BASIC)인증 헤더를 처리하여 결과를 SecurityContextHolder에 저장합니다.
- RememberMeAuthenticationFilter: SecurityContext에 인증(Authentication)객체가 있는지 확인하고 RememberMeServives를 구현한 객체 요청이 있을 경우, RememberMe를 인증 토큰으로 컨텍스트에 주입합니다.
- AnonymousAuthenticationFilter: 이 필터가 호출되는 시점까지 사용자 정보가 인증되지 않았다면 익명 사용자로 취급합니다.
- SessionManagementFilter: 요청이 시작된 이후 인증된 사용자인지 확인하고, 인증된 사용자일 경우 SessionAuthenticationStrategy를 호출하여 세션 고정 보호 매커니즘을 활성화 하거나 여러 동시 로그인을 확인하는 것과 같은 세련 관련 활동을 수행합니다.
- ExceptionTranslationFilter: 필터체인 내에서 발생하는 모든 예외를 처리합니다.
- FilterSecurityInterceptor: AccessDecisionManager로 권한 부여처리를 위임하고 HTTP리소스 보안처리를 수행합니다.

![alt text](/public/img/springboot_13.png)

1. 사용자가 입력한 정보를 가지고 인증을 요청한다. 
2. AuthenticationFilter가 이를 가로채 UsernamePasswordAuthenticationToken 객체를 생성한다.
3. 필터는 요청을 처리하고 AuthenticationManager의 구현체 ProviderManager에 Authentication과 UsernamePasswordAuthenticationToken을 전달한다.
4. AuthenticationManager는 검증을 위해 AuthenticationProvider에게 Authentication과 UsernamePasswordAuthenticationToken을 전달한다.
5. 이제 DB에 담긴 사용자 인증정보와 비교하기 위해 UserDetailsService에 사용자 정보를 넘겨준다.
6. DB에서 찾은 사용자 정보인 UserDetails객체를 만든다.
7. AuthenticationProvider는 UserDetails를 넘겨받고 비교한다.
8. 인증이 완료되면 권한과 사용자 정보를 담은 Authentication정보를 전달한다.
9. AuthenticationFilter까지 Authentication 객체가 반환된다.
10. Authentication을 SecurityContext에 저장한다.

Authentication정보는 결국 SecurityContextHolder 세션 영역에 있는 SecurityContext에 Authentication객체를 저장한다.

세션에 사용자 정보를 저장하는 것은 전통적인 세션-쿠키 기반의 인증방식을 사용한다는 것을 의미한다.

# JWT (Json Web Token)

JWT(Json Web Token)은 웹표준(RFC7519) 로서 일반적으로 클라이언트와 서버, 서비스와 서비스 사이 통신 시 권한 인가 (Authorization)을 위해 사용하는 토큰이다.

## HEADER.PAYLOAD.SIGNATURE

일반적으로 헤더, 페이로드, 서명 세 부분을 점으로 구분하는 구조로 되어있다.

헤더에는 토큰 타입과 해싱 알고리즘을 저장하고, 페이로드는 실제로 전달하는 정보, 서명에는 위변조를 방지하기 위한 값이 들어가게 된다.

![alt text](/public/img/springboot_14.png)

사용자 인증이 완료될 시 서버측에는 JWT 토큰을 BODY에 담아오게 되고 그 후 요청하는 API 서버에 JWT 토큰을 헤더에 담아 요청을 하게 되면 이를 확인하고 권한이 있는 사용자에게 리소스를 제공하게 된다.