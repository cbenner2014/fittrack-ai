package com.fitnessai.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Autowired
    private AuthInterceptor authInterceptor;

    @Autowired
    private AiRateLimitInterceptor aiRateLimitInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 1. Interceptor de Autenticación y Autorización Anti-IDOR
        registry.addInterceptor(authInterceptor)
                .addPathPatterns("/api/v1/**")
                .excludePathPatterns(
                        "/api/v1/users/login",
                        "/api/v1/users/register",
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html"
                );

        // 2. Interceptor de Rate Limiting para Endpoints de IA (Protección contra DoS de costos y saturación de Gemini)
        registry.addInterceptor(aiRateLimitInterceptor)
                .addPathPatterns(
                        "/api/v1/ai/**",
                        "/api/v1/meals/analyze",
                        "/api/v1/machines/analyze",
                        "/api/v1/coach-recommendations/generate-plan/**",
                        "/api/v1/coach-recommendations/generate-shopping-list"
                );
    }
}
