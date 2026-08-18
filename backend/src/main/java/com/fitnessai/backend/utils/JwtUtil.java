package com.fitnessai.backend.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret:BTrackDefaultSecureKeyForDevelopmentOnly2026Secure256BitKey!}")
    private String secret;

    @Value("${jwt.expiration-ms:604800000}")
    private long expirationTime;

    private SecretKey key;

    @PostConstruct
    public void init() {
        // Inicializar la llave criptográfica segura HMAC-SHA256 desde la variable inyectada
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(Long userId, String role) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role != null ? role : "ROLE_USER")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key)
                .compact();
    }

    public String generateToken(Long userId) {
        return generateToken(userId, "ROLE_USER");
    }

    public Long validateTokenAndGetUserId(String token) {
        try {
            Claims claims = getClaims(token);
            return Long.parseLong(claims.getSubject());
        } catch (Exception e) {
            return null; // Token inválido o expirado
        }
    }

    public String getRoleFromToken(String token) {
        try {
            Claims claims = getClaims(token);
            return claims.get("role", String.class);
        } catch (Exception e) {
            return "ROLE_USER";
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
