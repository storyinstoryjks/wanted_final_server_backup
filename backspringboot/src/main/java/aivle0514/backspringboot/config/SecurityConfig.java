package aivle0514.backspringboot.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    // 추가 보안 무시 목록
    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return web -> web.ignoring()
                .requestMatchers("/public/**", "/favicon.ico", "/assets/**", "/error");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable()) // CSRF 보호 비활성화

                // 🔐 스프링 시큐리티가 제공하는 formLogin 기능 사용
                .formLogin(form -> form
                        .loginProcessingUrl("/api/user/login") // 로그인 요청을 처리할 URL
                        .usernameParameter("email") // [핵심] 로그인 ID로 email 파라미터를 사용하도록 설정
                        .passwordParameter("password") // 로그인 시 비밀번호로 사용할 파라미터 이름
                        .permitAll()

                        // 로그인 성공 시 처리
                        .successHandler((request, response, authentication) -> {
                            response.setStatus(HttpStatus.OK.value());
                            response.getWriter().write("로그인 성공");
                        })
                        // 로그인 실패 시 처리
                        .failureHandler((request, response, exception) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.getWriter().write("이메일 또는 비밀번호가 올바르지 않습니다.");
                        })
                )

                // 🚪 로그아웃 설정
                .logout(logout -> logout
                        .logoutUrl("/api/user/logout") // 로그아웃을 처리할 URL
                        .logoutSuccessHandler((request, response, authentication) -> {
                            response.setStatus(HttpStatus.OK.value());
                        })
                )

                // [수정] 🔐 API 경로별 접근 권한 설정
                .authorizeHttpRequests(auth -> auth
                        // 추가-jks : 이미지 업로드 API와 정적 리소스는 인증 없이 허용 (고양이 프로필 사진)
                        .requestMatchers("/api/upload/cat-image").permitAll()
                        .requestMatchers("/public/**").permitAll()
                        // 아래 API들은 인증 없이 누구나 접근 가능
                        .requestMatchers("/api/user/**").permitAll() // 원본 : .requestMatchers("/api/user/signup", "/api/user/login", "/api/user/reset-password").permitAll()
                        // /api/user/me, /api/user/logout 등 그 외 /api/user/ 경로는 인증 필요
                        .requestMatchers("/api/**").authenticated() // 원본 : .requestMatchers("/api/user/**").authenticated()
                        // 나머지 모든 요청은 인증된 사용자만 접근 가능
                        .anyRequest().authenticated()
                );

        return http.build();
    }

    // CORS 설정
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // configuration.setAllowedOrigins(Arrays.asList("https://5174-sjleecatthe-wantedcat-7dxfzhg0f8g.ws-us121.gitpod.io"));
        configuration.setAllowedOriginPatterns(List.of("https://*.gitpod.io"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}