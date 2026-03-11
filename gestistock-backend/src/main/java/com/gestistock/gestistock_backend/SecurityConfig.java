package com.gestistock.gestistock_backend;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Désactive la protection CSRF pour les tests
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // AUTORISE TOUT LE MONDE
            );
        return http.build();
    }
}