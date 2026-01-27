// backend/src/main/java/com/bteam/ovs/config/security/SecurityConfig.java
package com.bteam.ovs.config.security;

import java.util.List;

import com.bteam.ovs.auth.entity.AccountKind;
import com.bteam.ovs.auth.entity.Role;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
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

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of());
        config.setAllowCredentials(false);

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

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        // ---- public / user auth ----
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/verify").permitAll()

                        // elections は GET だけ公開
                        .requestMatchers(HttpMethod.GET, "/api/elections/**").permitAll()

                        // ---- staff auth ----
                        .requestMatchers("/api/staff/auth/login").permitAll()

                        // staff 用API
                        .requestMatchers("/api/staff/**")
                        .access((authentication, context) -> new AuthorizationDecision(
                                isKind(authentication.get(), AccountKind.STAFF)))

                        // ---- admin auth (互換で残すなら) ----
                        .requestMatchers("/api/admin/auth/login").permitAll()

                        // /api/admin/** は「STAFF かつ ADMIN/COMMITTEE」
                        .requestMatchers("/api/admin/**")
                        .access((authentication, context) -> new AuthorizationDecision(
                                isKind(authentication.get(), AccountKind.STAFF)
                                        && hasAnyRole(authentication.get(), Role.ADMIN, Role.COMMITTEE)))

                        // ---- demo tools ----
                        .requestMatchers("/api/demo/**")
                        .access((authentication, context) -> new AuthorizationDecision(
                                isKind(authentication.get(), AccountKind.STAFF)
                                        && hasRole(authentication.get(), Role.ADMIN)))

                        // ---- identity (user only) ----
                        .requestMatchers("/api/identity/**")
                        .access((authentication, context) -> new AuthorizationDecision(
                                isKind(authentication.get(), AccountKind.USER)))

                        // ---- voter only (user + voter role) ----
                        .requestMatchers("/api/voting/**", "/api/votes/**")
                        .access((authentication, context) -> new AuthorizationDecision(
                                isKind(authentication.get(), AccountKind.USER)
                                        && hasRole(authentication.get(), Role.VOTER)))

                        .anyRequest().authenticated())

                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class)
                .build();
    }
}
