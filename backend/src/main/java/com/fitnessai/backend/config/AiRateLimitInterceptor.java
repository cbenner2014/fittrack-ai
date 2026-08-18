package com.fitnessai.backend.config;

import com.fitnessai.backend.services.RateLimiterService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AiRateLimitInterceptor implements HandlerInterceptor {

    @Autowired
    private RateLimiterService rateLimiterService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Permitir preflight CORS (OPTIONS)
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        // Obtener el ID de usuario del token (o la IP del cliente si no está logueado aún)
        Object userIdAttr = request.getAttribute("userId");
        String clientKey = userIdAttr != null ? "user_" + userIdAttr.toString() : "ip_" + getClientIp(request);

        if (!rateLimiterService.tryAcquire(clientKey)) {
            long waitSeconds = rateLimiterService.getRemainingCooldownSeconds(clientKey);
            response.setStatus(429); // 429 Too Many Requests
            response.setContentType("application/json;charset=UTF-8");
            response.setHeader("Retry-After", String.valueOf(waitSeconds));
            response.getWriter().write(String.format(
                    "{\"success\": false, \"error\": \"Has alcanzado el límite de análisis de IA (máximo 5 por minuto). Por favor, espera %d segundos antes de realizar otro escaneo.\", \"status\": 429, \"cooldownSeconds\": %d}",
                    waitSeconds, waitSeconds
            ));
            return false;
        }

        return true;
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
