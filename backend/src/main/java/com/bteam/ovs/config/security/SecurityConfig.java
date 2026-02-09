// backend/src/main/java/com/bteam/ovs/config/security/SecurityConfig.java
package com.bteam.ovs.config.security;

import java.util.Arrays; // 追加
import java.util.List;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.springframework.security.config.Customizer.withDefaults;
import static com.bteam.ovs.shared.security.Authz.*;

@Configuration
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173,http://192.168.50.222:5173}")
    private String allowedOrigins;

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of());
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService) throws Exception {

        return http
                .cors(withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(401);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"message\":\"Unauthorized\"}");
                        })
                        .accessDeniedHandler((req, res, e) -> {
                            res.setStatus(403);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"message\":\"Forbidden\"}");
                        }))

                .authorizeHttpRequests(auth -> auth

                        // =========================
                        // Public (no auth)
                        // =========================
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        .requestMatchers("/api/public/identity/verify").permitAll()
                        .requestMatchers("/api/public/vote-token/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demo/personas").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/public/notices/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/announcement/**").permitAll()

                        // 本人認証トークンが必要（ログイン不要だが「認証は必要」）
                        .requestMatchers("/api/public/voting/**").authenticated()
                        .requestMatchers("/api/public/alloc-voting/**").authenticated()

                        // ---- public / user auth ----
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/verify",
                                "/api/auth/nfc-login")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/auth/me", "/api/auth/me/detail")
                        .authenticated()

                        // ---- staff auth ----
                        .requestMatchers("/api/staff/auth/login").permitAll()

                        // ---- admin auth (互換で残すなら) ----
                        .requestMatchers("/api/admin/auth/login").permitAll()

                        // ---- identity (public) ----
                        .requestMatchers("/api/identity/nfc/resolve").permitAll()

                        // ---- read-only public APIs ----
                        // elections / candidates / parties / master は GET だけ公開
                        // （結果系を明示で上に置いておくと「ここだけ公開」を変えたくなった時も安全）
                        .requestMatchers(HttpMethod.GET,
                                "/api/elections/*/result",
                                "/api/elections/*/alloc-result")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/elections/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidates/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/parties/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/master/**").permitAll()

                        // =========================
                        // Staff-only APIs
                        // =========================
                        .requestMatchers("/api/staff/**")
                        .access((a, c) -> decide(a.get(), AccountKind.STAFF))

                        // /api/admin/** は「STAFF かつ ADMIN/COMMITTEE」
                        .requestMatchers("/api/admin/**")
                        .access((a, c) -> decide(
                                isKind(a.get(), AccountKind.STAFF)
                                        && hasAnyRole(a.get(), Role.ADMIN,
                                                Role.COMMITTEE)))

                        // ---- demo tools (staff admin only) ----
                        // .requestMatchers("/api/demo/**")
                        // .access((a, c) -> decide(a.get(), AccountKind.STAFF, Role.ADMIN))

                        // =========================
                        // User-only APIs
                        // =========================
                        // ---- favorites (user only) ----
                        .requestMatchers("/api/favorites/**")
                        .access((a, c) -> decide(a.get(), AccountKind.USER))

                        // ---- identity (user only) ----
                        .requestMatchers("/api/identity/**")
                        .access((a, c) -> decide(a.get(), AccountKind.USER))

                        // ---- voter only (user + voter role) ----
                        .requestMatchers("/api/voting/**", "/api/votes/**",
                                "/api/alloc-voting/**")
                        .access((a, c) -> decide(
                                isKind(a.get(), AccountKind.USER)
                                        && hasRole(a.get(), Role.VOTER)))

                        .anyRequest().authenticated())

                .addFilterBefore(new VoteTokenAuthenticationFilter(jwtService),
                        UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(new JwtAuthenticationFilter(jwtService),
                        UsernamePasswordAuthenticationFilter.class)
                .build();

    }
}
