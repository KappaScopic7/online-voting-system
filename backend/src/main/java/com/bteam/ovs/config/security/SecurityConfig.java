// backend/src/main/java/com/bteam/ovs/config/security/SecurityConfig.java
package com.bteam.ovs.config.security;

import java.util.Arrays;
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

                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/error").permitAll()

                        .requestMatchers("/api/public/identity/verify").permitAll()
                        .requestMatchers("/api/public/vote-token/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/demo/personas").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/public/notices/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/public/announcement/**").permitAll()

                        .requestMatchers("/api/public/voting/**").authenticated()
                        .requestMatchers("/api/public/alloc-voting/**").authenticated()
                        .requestMatchers("/api/public/judge-review/**").authenticated()
                        .requestMatchers("/api/public/pairings/**").permitAll()
                        .requestMatchers("/api/public/link-pairings/**").permitAll()

                        .requestMatchers(
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/verify",
                                "/api/auth/nfc/login",
                                "/api/auth/nfc/exchange",
                                "/api/auth/nfc/link/login",
                                "/api/auth/nfc/link/exchange")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/auth/me", "/api/auth/me/detail")
                        .authenticated()

                        .requestMatchers("/api/staff/auth/login").permitAll()

                        .requestMatchers("/api/admin/auth/login").permitAll()

                        .requestMatchers("/api/identity/nfc/resolve").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/api/elections/*/result",
                                "/api/elections/*/alloc-result")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/elections/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/candidates/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/parties/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/master/**").permitAll()

                        .requestMatchers("/api/staff/**")
                        .access((a, c) -> decide(a.get(), AccountKind.STAFF))

                        .requestMatchers("/api/admin/**")

                        .access((a, c) -> decide(
                                isKind(a.get(), AccountKind.STAFF)
                                        && hasAnyRole(a.get(), Role.ADMIN,
                                                Role.COMMITTEE)))

                        .requestMatchers("/api/favorites/**")
                        .access((a, c) -> decide(a.get(), AccountKind.USER))

                        .requestMatchers("/api/identity/**")
                        .access((a, c) -> decide(a.get(), AccountKind.USER))

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
