package com.fitnessai.backend.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // 256-bit secret key for HMAC-SHA256 (in production, use environment variable)
    private final String SECRET = "A-Very-Secure-Super-Secret-Key-For-B-Track-App-2026!!!";
    private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());
    
    // Token valid for 7 days
    private final long EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7;

    public String generateToken(Long userId) {
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key)
                .compact();
    }

    public Long validateTokenAndGetUserId(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return Long.parseLong(claims.getSubject());
        } catch (Exception e) {
            return null; // Invalid token
        }
    }
}
