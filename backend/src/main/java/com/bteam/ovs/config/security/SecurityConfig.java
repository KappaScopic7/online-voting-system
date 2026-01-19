package com.bteam.ovs.config.security;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.springframework.security.config.Customizer.withDefaults;

import com.bteam.ovs.auth.security.JwtAuthenticationFilter;
import com.bteam.ovs.auth.security.JwtService;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
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

                        // ---- admin auth ----
                        .requestMatchers("/api/admin/auth/login").permitAll()

                        // ★ /api/admin/** は「STAFF かつ ADMIN/COMMITTEE」
                        .requestMatchers("/api/admin/**").access((authentication, context) ->
                                new AuthorizationDecision(isStaff(authentication.get()) && hasAnyRole(authentication.get(), "ADMIN", "COMMITTEE"))
                        )

                        // ---- identity (user only) ----
                        .requestMatchers("/api/identity/**").access((authentication, context) ->
                                new AuthorizationDecision(isUser(authentication.get()))
                        )

                        // ---- voter only (user + voter role) ----
                        .requestMatchers("/api/voting/**").access((authentication, context) ->
                                new AuthorizationDecision(isUser(authentication.get()) && hasRole(authentication.get(), "VOTER"))
                        )
                        .requestMatchers("/api/votes/**").access((authentication, context) ->
                                new AuthorizationDecision(isUser(authentication.get()) && hasRole(authentication.get(), "VOTER"))
                        )

                        .anyRequest().authenticated()
                )

                .addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // ===== helpers =====

    private static boolean isStaff(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("KIND_STAFF"));
    }

    private static boolean isUser(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("KIND_USER"));
    }

    private static boolean hasRole(Authentication auth, String role) {
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    private static boolean hasAnyRole(Authentication auth, String... roles) {
        if (auth == null) return false;
        for (String r : roles) {
            if (hasRole(auth, r)) return true;
        }
        return false;
    }
}
