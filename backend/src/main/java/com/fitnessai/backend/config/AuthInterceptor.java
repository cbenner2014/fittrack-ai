package com.fitnessai.backend.config;

import com.fitnessai.backend.utils.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private JwtUtil jwtUtil;

    // Patrones de URI para detectar el ID de usuario objetivo y prevenir IDOR / BOLA
    private static final Pattern USER_ID_PATH_PATTERN = Pattern.compile("^/api/v1/users/(\\d+)(?:/.*)?$");
    private static final Pattern RESOURCE_USER_PATTERN = Pattern.compile("^/api/v1/[^/]+/user/(\\d+)(?:/.*)?$");
    private static final Pattern GENERATE_PLAN_PATTERN = Pattern.compile("^/api/v1/coach-recommendations/generate-plan/(\\d+)(?:/.*)?$");

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Permitir preflight CORS (OPTIONS)
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\": \"No token provided or invalid format\"}");
            return false;
        }

        String token = authHeader.substring(7);
        Long tokenUserId = jwtUtil.validateTokenAndGetUserId(token);

        if (tokenUserId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"error\": \"Invalid or expired token\"}");
            return false;
        }

        String role = jwtUtil.getRoleFromToken(token);
        request.setAttribute("userId", tokenUserId);
        request.setAttribute("userRole", role);

        String uri = request.getRequestURI();

        // Control de Acceso para Rutas Administrativas (/api/v1/admin/**)
        if (uri.startsWith("/api/v1/admin")) {
            if (!"ROLE_ADMIN".equals(role)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\": \"Acceso Denegado: Se requieren privilegios de Administrador.\"}");
                return false;
            }
            return true; // Administrador tiene acceso total a rutas admin
        }

        // Control de Acceso Estricto (Anti-IDOR) para usuarios normales:
        // Si el usuario es administrador, puede auditar cualquier cuenta; si es usuario normal, solo la suya
        if (!"ROLE_ADMIN".equals(role)) {
            Long targetUserId = extractTargetUserId(uri);
            if (targetUserId != null && !targetUserId.equals(tokenUserId)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\": \"Acceso Denegado: No tienes permisos para acceder o modificar la cuenta de otro usuario.\"}");
                return false;
            }
        }

        return true;
    }

    private Long extractTargetUserId(String uri) {
        Matcher m1 = USER_ID_PATH_PATTERN.matcher(uri);
        if (m1.matches()) {
            return Long.parseLong(m1.group(1));
        }

        Matcher m2 = RESOURCE_USER_PATTERN.matcher(uri);
        if (m2.matches()) {
            return Long.parseLong(m2.group(1));
        }

        Matcher m3 = GENERATE_PLAN_PATTERN.matcher(uri);
        if (m3.matches()) {
            return Long.parseLong(m3.group(1));
        }

        return null;
    }
}
