---
layout: post
title: "[SpringBoot] Spring Security + JWT 로그인구현해보기1"
date: 2023-01-26 16:00:00 +0900
category: springboot
---

[modsiw.log 님](https://velog.io/@modsiw/Spring-Spring-Security-JWT-%EB%A1%9C%EA%B7%B8%EC%9D%B8-%EA%B5%AC%ED%98%84%ED%95%B4%EB%B3%B4%EA%B8%B0){:target="_blank"} 

# 구현할 보안 매커니즘

- 이름, 사용자 이름, 이메일, 비밀번호로 새 사용자를 등록하는 API 작성
- 사용자 이름/ 이메일 및 비밀번호를 사용하여 로그인할 수 있도록 API를 빌드합니다.
    - 사용자 자격 증명의 유효성을 검사한 후 API는 JWT인증 토큰을 생성하고 응답에서 토큰을 반환해야 합니다.
    - 클라이언트는 Authorization 보호된 리소스에 엑세스하기 위한 모든 요청의 헤더에 이 JWT토큰을 보냅니다.
- 보호된 리소스에 대한 엑세스를 제한하도록 Spring 보안을 구성합니다.
    - 예를들어 로그인, 가입을 위한 API 및 이미지, 스크립트 및 스타일 시트와 같은 정적 리소스는 모든 사람이 엑세스를 할 수 있어야 합니다.
    - 글 작성, 작성 등을 위한 API는 인증된 사용자만 엑세스 할 수 있어야 합니다.
- 클라이언트가 유효한 JWT 토큰없이 보호된 리소스에 엑세스하려고 하면 401 무단 오류가 발생하도록 Spring 보안을 구성합니다.
- 서버의 리소스를 보호하도록 역할 기반 권한 부여를 구성합니다.
    - 예를들어 역할이 있는 사용자만 ADMIN 생성할 수 있습니다.
    - 예를들어 역할이 있는 사용자만 USER에서 포스트 작성할 수 있습니다.

# 스프링 보안 및 JWT 구성

다음 클래스는 보안 구현의 핵심입니다.

여기에는 프로젝트에 필요한 거의 모든 보안 구성이 포함되어 있습니다.

SecurityConfig 먼저 패키지 내부에 config 폴더를 생성하고 코드를 살펴보고 각 구성이 수행하는 작업을 알아보겠습니다.

```java
package com.record.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.record.backend.security.CustomUserDetailsService;
import com.record.backend.security.JwtAuthenticationEntryPoint;
import com.record.backend.security.JwtAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableGlobalMethodSecurity(
    securedEnabled = true,
    jsr250Enabled = true,
    prePostEnabled = true
)
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Autowired
    CustomUserDetailsService customUserDetailService;

    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    @Bean
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder authenticationManagerBuilder) throws Exception {
        authenticationManagerBuilder
            .userDetailsService(customUserDetailService)
            .passwordEncoder(passwordEncoder());
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .cors()
                .and()
            .csrf()
                .disable()
            .exceptionHandling()
                .authenticationEntryPoint(unauthorizedHandler)
                .and()
            .sessionManagement()
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeRequests()
            .antMatchers("/",
                "/favicon.ico",
                "/**/*.png",
                "/**/*.gif",
                "/**/*.svg",
                "/**/*.jpg",
                "/**/*.html",
                "/**/*.css",
                "/**/*.js")
            .permitAll()
            .antMatchers("/api/auth/**")
            .permitAll()
            .antMatchers("/api/user/checkUsernameAvailability", "/api/user/checkEmailAvailability")
            .permitAll()
            .antMatchers(HttpMethod.GET, "/api/polls/**", "/api/users/**")
            .permitAll()
            .anyRequest()
            .authenticated();

        // Add our custom JWT security filter
        http.addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
}
```

1. @EnableWebSecurity: 이것은 프로젝트에서 웹 보안을 활성화하는데 사용되는 기본 스프링 보안 주석입니다.
1. @EnableGlobalMethodSecurity: 이것은 주석을 기반으로 하는 ``메서드 수준 보안을 활성화하는데 사용됩니다.`` 메소드 보안을 다음 세가지 유형의 주석을 사용할 수 있습니다.
    - secureEnabled: 다음 ``@Secured``와 같이 컨트롤서/서비스 메서드를 보호할 수 있는 주석을 활성화 합니다.
        ```java
        @Secured("ROLE_ADMIN")
        public User getAllUsers() {}

        @Secured({"ROLE_USER", "ROLE_ADMIN"})
        public User getUser(Long id) {}

        @Secured("IS_AUTHENTICATED_ANONYMOUSLY")
        public boolean isUsernameAvailable() {}
        ```
    - jsr250Enabled: 다음 ``@RolesAllowed``과 같이 사용할 수 있는 주석을 활성화합니다.
        ```java
        @RolesAllowed("ROLE_ADMIN")
        public Poll createPoll() {}
        ```
    - prePostEnabled: ``@PreAuthorize`` 및 ``@PostAuthorize`` 주석을 사용하여 보다 복잡한 표현식 기반 엑세스 제어 구문을 활성화합니다.
        ```java
        @PreAuthorize("isAnonymous()")
        public boolean isUsernameAvailable() {}

        @PreAuthorize("hasRole('USER')")
        public Poll createPoll() {}
        ```
1. WebSecurityConfigurerAdapter: 이 클래스는 Spring Security의 WebSecurityConfigurer 인터페이스를 구현합니다. 기본 보안 구성을 제공하고 다른 클래스가 이를 확장하고 해당 메서드를 재정의하여 보안 구성을 사용자가 지정할 수 있도록 합니다. SecurityConfig 클래스 WebSecurityConfigurerAdapter는 사용자 정의 보안 구성을 제공하기 위해 일부 메서드를 확장하고 재정의합니다.
1. CustomUserDetails 서비스: 사용자를 인증하거나 다양한 기반 검사를 수행하려면 Spring보안에서 사용자 세부 정보를 어떻게든 로드해야 합니다. UserDetailsService 이를 위해 사용자 이름을 기반으로 사용자를 로드하는 단일 메서드가 있는 인터페이스로 구성됩니다. 
    ```java
    UserDetails loadUserByUsername(String username) throws UsernameNotFoundException;
    ```
    인터페이스를 구현하고 메서드에 대한 구현을 제공하는 CustomUserDetailsService를 정의힙니다.
    User DetailsService loadUserByUsername() 메서드는 UserDetails Spring Security가 다양한 인증 및 역할 기반 유효성 검사를 수행하는데 사용하는 객체를 반환합니다.
    구현에서 인터페이스를 구현하고 메서드에서 개체를 반환하는 사용자 지정 UserPrincipal 클래스도 정의합니다.
    UserDetails UserPrincipal loadUserByUsername()
1. JwtAuthenticationEntryPoint: 이 클래스는 적절한 인증없이 보호된 리소스에 액세스하려고 하는 클라이언트에 401 무단 오류를 반환하는데 사용됩니다. Spring Security의 AuthenticationEntryPoint 인터페이스를 구현합니다.
1. Jwt 인증 필터: 우리는 JwtAuthenticationFilter 다음과 같은 필터를 구현하는데 사용할 것입니다.
    - Authorization 모든 요청의 헤더에서 JWT인증 토큰을 읽습니다.
    - 토큰의 유효성을 검사합니다.
    - 해당 토큰과 관련된 사용자 세부 정보를 로드합니다.
    - Spring Security의 SecurityContext Spring Security는 사용자 세부 정보를 사용하여 권한 부여 검사를 수행합니다. 또한 컨트롤러에 저장된 사용자 세부 정보에 엑세스하여 SecurityContext 비즈니스 로직을 수행할 수 있습니다.
1. AuthenticationManagerBuilder 및 AuthenticaitonManager: AuthenticationManagerBuilder AuthenticationManager 사용자 인증을 위한 기본 Spring Security 인터페이스인 인스턴스를 생성하는데 사용됩니다.  AuthenticationManagerBuilder 메모리 내 인증.  LDAP 인증. JDBC 인증을 구축하거나 사용자 지정 인증 공급자를 추가하는데 사용할 수 있습니다. 이 예제에서 우리는 AuthenticationManager를 빌드하기 위해 customUserDetailsService와 passwordEncoder를 제공했습니다. AuthenticationManager 로그인 API에서는 사용자를 인증하도록 구성된 것을 사용할 것입니다.
1. HttpSecurity 구성: HttpSecurity csrf 구성 및 sessionManagement 등 다양한 조건에 따라 리소스르 보호하는 규칙을 추가하는데 사용됩니다. 구성에 JWTAuthenticationEntryPoint 및 사용자 지정도 추가했습니다.

# 사용자 정의 Spring 보안 클래스, 필터, 어노테이션 생성

이전 섹션에서 많은 사용자 정의 클래스와 필터를 사용하여 스프링 보안을 구성했습니다.

이 섹션에서는 이러한 클래스를 하나씩 정의합니다.

다음 모든 사용자 지정 보안 관련 클래스는 security 패키지를 생성하여 이 안에 들어갑니다.

1. 커스텀 스프링 시큐리티 AuthenticationEntryPoint:  commence() 이 메서드는 인증되지 않은 사용자가 인증이 필요한 리소스에 엑세스하려고 하여 예외가 throw 될 때마다 호출됩니다. 이 경우 예외 메시지가 포함된 401 오류로 간단히 응답합니다.
    ```java
    package com.example.polls.security;

    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.security.core.AuthenticationException;
    import org.springframework.security.web.AuthenticationEntryPoint;
    import org.springframework.stereotype.Component;

    import javax.servlet.ServletException;
    import javax.servlet.http.HttpServletRequest;
    import javax.servlet.http.HttpServletResponse;
    import java.io.IOException;

    @Component
    public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
        private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationEntryPoint.class);
        @Override
        public void commence(HttpServletRequest httpServletRequest, HttpServletResponse httpServletResponse, AuthenticationException e) throws IOException, ServletException {
            logger.error("Respoding with unauthorized error. Message - {}", e.getMessage());
            httpServletResponse.sendError(HttpServletResponse.SC_UNAUTHORIZED, e.getMessage());
        }
    }
    ```
1. 커스텀 스프링 시큐리티 사용자 정보: UserPrincipal 이라고 불리는 UserDetails 를 상속하는 사용자 정의 클래스를 정의해 보겠습니다. 이것은 UserDetailsService 사용자 정의에서 인스턴스가 반환될 클래스입니다. Spring Security 는 객체에 저장된 정보를 사용하여 UserPrincipal 인증 및 권한 부여를 수행합니다.
    ```java
    package com.example.polls.security;

    import com.example.polls.model.User;
    import com.fasterxml.jackson.annotation.JsonIgnore;
    import org.springframework.security.core.GrantedAuthority;
    import org.springframework.security.core.authority.SimpleGrantedAuthority;
    import org.springframework.security.core.userdetails.UserDetails;

    import java.util.Collection;
    import java.util.List;
    import java.util.Objects;
    import java.util.stream.Collectors;

    public class UserPrincipal implements UserDetails {

        private Long id;

        private String name;

        private String username;

        @JsonIgnore
        private String email;

        @JsonIgnore
        private String password;

        private Collection<? extends GrantedAuthority> authorities;

        public UserPrincipal(Long id, String name, String username, String email, String password, Collection<? extends GrantedAuthority> authorities) {
            this.id = id;
            this.name = name;
            this.username = username;
            this.email = email;
            this.password = password;
            this.authorities = authorities;
        }

        public static UserPrincipal create(User user) {
            List<GrantedAuthority> authorities = user.getRoles().stream().map(role -> new SimpleGrantedAuthority(role.getName().name())).collect(Collectors.toList());
            return new UserPrincipal(
                user.getId(),
                user.getName(),
                user.getUsername(),
                user.getEmail(),
                user.getPassword(),
                authorities
            );
        }
        public Long getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getEmail() {
            return email;
        }

        @Override
        public String getUsername() {
            return username;
        }

        @Override
        public String getPassword() {
            return password;
        }

        @Override
        public Collection<? extends GrantedAuthority> getAuthorities() {
            return authorities;
        }

        @Override
        public boolean isAccountNonExpired() {
            return true;
        }

        @Override
        public boolean isAccountNonLocked() {
            return true;
        }

        @Override
        public boolean isCredentialsNonExpired() {
            return true;
        }

        @Override
        public boolean isEnabled() {
            return true;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            UserPrincipal that = (UserPrincipal) o;
            return Objects.equals(id, that.id);
        }

        @Override
        public int hashCode() {
            return Objects.hash(id);
        }
    }
    ```
1. 커스텀 스프링 시큐리티 UserDetailsService: UserDetailsService 이제 사용자 이름이 지정된 사용자 데이터를 로드하는 사용자 지정을 정의해 보겠습니다.
    ```java
    package com.example.polls.security;

    import com.example.polls.model.User;
    import com.example.polls.repository.UserRepository;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.security.core.userdetails.UserDetails;
    import org.springframework.security.core.userdetails.UserDetailsService;
    import org.springframework.security.core.userdetails.UsernameNotFoundException;
    import org.springframework.stereotype.Service;
    import org.springframework.transaction.annotation.Transactional;

    @Service
    public class CustomUserDetailsService implements UserDetailsService {

        @Autowired
        UserRepository userRepository;

        @Override
        @Transactinal
        public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
            // Let people login with either username or email
            User user = userRepository.findByusernameOremail(usernameOrEmail, usernameOrEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username or email: " + usernameOrEmail));
            
            return UserPrincipal.create(user);
        }
    }
    ```
    첫 번째 방법 loadUserByUsername() 은 Spring 보안에서 사용됩니다.
    메소드의 사용에 주의하세요.
    findByUsernameOrEmail 이를 통해 사용자는 사용자 이름이나 이메일을 사용하여 로그인할 수 있습니다.

    두번째 방법 loadUserById()은 JWTAuthenticationFilter 곧 정의할 것입니다.
1. JWT 생성 및 검증을 위한 유틸리티 클래스: 다음 유틸리티 클래스는 사용자가 성공적으로 로그인한 후 JWT를 생성하고 요청의 Authorization 헤더에 전송된 JWT를 검증하는데 사용됩니다.
    ```java
    package com.record.backend.security;

    import java.nio.charset.StandardCharsets;
    import java.security.Key;
    import java.util.Date;

    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.security.core.Authentication;
    import org.springframework.stereotype.Component;

    import io.jsonwebtoken.Claims;
    import io.jsonwebtoken.ExpiredJwtException;
    import io.jsonwebtoken.Jwts;
    import io.jsonwebtoken.MalformedJwtException;
    import io.jsonwebtoken.UnsupportedJwtException;
    import io.jsonwebtoken.security.Keys;

    @Component
    public class JwtTokenProvider {
        private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

        @Value("${app.jwtSecret}")
        private String jwtSecret;

        @Value("${app.jwtExpirationInMs}")
        private int jwtExpirationInMs;

        public String generateToken(Authentication authentication) {

            UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

            Date now = new Date();
            Date expireDate = new Date(now.getTime() + jwtExpirationInMs);

            return Jwts.builder()
                .setSubject(Long.toString(userPrincipal.getId()))
                .setIssuedAt(new Date())
                .setExpiration(expireDate)
                .signWith(getSignKey())
                .compact();
        }

        public Long getUserIdFromJwt(String token) {
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSignKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

            return Long.parseLong(claims.getSubject());
        }

        public boolean validateToken(String authToken) {
            try {
                Jwts.parserBuilder().setSigningKey(getSignKey()).build().parseClaimsJws(authToken);
                return true;
            } catch (MalformedJwtException e) {
                logger.error("Invalid JWT token");
            } catch (ExpiredJwtException e) {
                logger.error("Expired JWT token");
            } catch (UnsupportedJwtException e) {
                logger.error("Unsupported JWT token");
            } catch (IllegalArgumentException e) {
                logger.error("JWT claims string is empty");
            }
            return false;
        }

        private Key getSignKey() {
            return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF-8));
        }
    }
    ```
    여기서 jwtSecret 과 jwtExpirationMs는 application.yml 파일에 정의해놨습니다.
    ```yaml
    app:
        jwtSecret: jwtsigntutorialasdfasdfasdfasdfasdf
        jwtExpirationInMs: 604800000
    ```
1. 커스텀 스프링 스큐리티 인증 필터: 마지막으로 JwtAuthenticationFilter 요청에서 JWT 토큰을 가져오고 유효성을 검사하고 토큰과 연결된 사용자를 로드하고 이를 Spring Security에 전달하도록 작성해 보겠습니다.
    ```java
    package com.record.backend.security;

    import java.io.IOException;

    import javax.servlet.FilterChain;
    import javax.servlet.ServletException;
    import javax.servlet.http.HttpServletRequest;
    import javax.servlet.http.HttpServletResponse;

    import org.slf4j.Logger;
    import org.slf4j.LoggerFactory;
    import org.springframework.beans.factory.annotation.Autowired;
    import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
    import org.springframework.security.core.context.SecurityContextHolder;
    import org.springframework.security.core.userdetails.UserDetails;
    import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
    import org.springframework.util.StringUtils;
    import org.springframework.web.filter.OncePerRequestFilter;

    public class JwtAuthenticationFilter extends OncePerRequestFilter {

        @Autowired
        private JwtTokenProvider tokenProvider;

        @Autowired
        private CustomUserDeailsService customUserDetailsService;

        private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    	@Override
    	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
    		FilterChain filterChain) throws ServletException, IOException {
            
            try {
                String jwt = getJwtFromRequest(request);

                if (StringUils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                    Long userId = tokenProvider.getUserIdFromJwt(jwt);

                    UserDetails userDetails = customUserDetailsService.loadUserById(userId);
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                logger.error("Could not set user authentication in security context", ex);
            }
            filterChain.doFilter(request, response);

        }

        private String getJwtFromRequest(HttpServletRequest request) {
            String bearerToken = request.getHeader("Authorization");
            if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
                return bearerToken.substring(7, bearerToken.length());
            }
            return null;
        }
    }
    ```
    위의 경우 먼저 요청 헤더 filter에서 검색된 JWT를 구문 분석하고 사용자 ID를 가져옵니다.
    Authorization 그런 다음 데이터베이스에서 사용자 세부 정보를 로드하고 스프링 보안 컨텍스트 내에서 인증을 설정합니다.
    위의 데이터베이스 적중 filter는 선택사항입니다.
    JWT 클레임 내에서 사용자의 사용자이름과 역할을 인코딩하고 UserDetailsJWT에서 해당 클레임을 구문 분석하여 객체를 생성할 수도 있습니다.
    그러면 데이터베이스 히트를 피할 수 있습니다.
    그러나 데이터베이스에서 사용자의 현재 세부 정보를 로드하는 것은 여전히 도움이 될 수 있다.
    예를 들어, 사용자의 역할이 변경되었거나 이 JWT를 만든 후 사용자가 자신의 비밀번호를 업데이트 한 경우 이 JWT를 사용한 로그인을 허용하지 않을 수 있습니다.
1. 현재 로그인한 사요자에 접근하기 위한 사용자 정의 어노테이션 작성
    Spring보안은 @AuthenticationPrincipal 컨트롤러에서 현재 인증된 사용자에 엑세스하기 위해 호출되는 주석을 제공합니다.
    다음 CurrentUser 주석은 주석을 둘러싼 래퍼 @AuthenticationPrincipal 입니다.
    ```java
    package com.example.polls.security;

    import org.springframework.security.core.annotation.AuthenticationPrincipal;
    import java.lang.annotation.*;

    @Target({ElementType.PARAMETER, ElementType.TYPE})
    @Retention(RetentionPolicy.RUNTIME)
    @Documented
    @AuthenticationPrincipal
    public @interface CurrentUser {

    }
    ```
    프로젝트 모든 곳에서 Spring Security 관련 주석을 너무 많이 얽매이지 않도록 메타 주석을 만들었습니다.
    이것은 Spring Security에 대한 의존성을 감소시킨다.
    CurrentUser따라서 프로젝트에서 Spring Security를 제거하기로 결정했다면 간단히 주석을 변경하여 쉽게 제거할 수 있습니다.