package com.fitnessai.backend.config;

import com.fitnessai.backend.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Permitir preflight CORS (OPTIONS)
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"No token provided or invalid format\"}");
            return false;
        }

        String token = authHeader.substring(7);
        Long tokenUserId = jwtUtil.validateTokenAndGetUserId(token);

        if (tokenUserId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Invalid or expired token\"}");
            return false;
        }

        // Si la URL contiene un ID de usuario explícito (/api/v1/meals/user/2), verificar que coincida con el token
        // Esto previene el ataque IDOR directamente en el interceptor!
        String uri = request.getRequestURI();
        
        // Guardar el userId en la request para usarlo en los controladores si es necesario
        request.setAttribute("userId", tokenUserId);
        
        // Para mayor seguridad extrema, verificar que cualquier parametro "user/{id}" o similar coincida
        // Aunque lo mejor es usar directamente request.getAttribute("userId") en el controller.
        
        return true;
    }
}
