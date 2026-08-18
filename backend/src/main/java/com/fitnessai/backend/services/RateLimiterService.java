package com.fitnessai.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    // Límite de peticiones de IA por ventana de tiempo (por defecto 5 peticiones por minuto)
    @Value("${ai.rate-limit.max-requests:5}")
    private int maxRequests;

    @Value("${ai.rate-limit.window-seconds:60}")
    private long windowSeconds;

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    public boolean tryAcquire(String userKey) {
        long now = System.currentTimeMillis();
        long windowMillis = windowSeconds * 1000;

        TokenBucket bucket = buckets.compute(userKey, (key, existing) -> {
            if (existing == null) {
                return new TokenBucket(maxRequests - 1.0, now);
            }

            // Recargar tokens si el tiempo ha transcurrido
            long elapsed = now - existing.lastRefillTime;
            if (elapsed >= windowMillis) {
                existing.tokens = maxRequests - 1.0;
                existing.lastRefillTime = now;
            } else {
                // Cálculo proporcional de recarga de tokens
                double tokensToAdd = ((double) elapsed / windowMillis) * maxRequests;
                existing.tokens = Math.min(maxRequests, existing.tokens + tokensToAdd);
                existing.lastRefillTime = now;

                if (existing.tokens >= 1.0) {
                    existing.tokens -= 1.0;
                } else {
                    existing.tokens = -1.0; // Señal de agotado
                }
            }
            return existing;
        });

        // Limpieza periódica de buckets inactivos para evitar fugas de memoria
        if (buckets.size() > 1000) {
            buckets.entrySet().removeIf(entry -> (now - entry.getValue().lastRefillTime) > (windowMillis * 5));
        }

        return bucket.tokens >= 0;
    }

    public long getRemainingCooldownSeconds(String userKey) {
        TokenBucket bucket = buckets.get(userKey);
        if (bucket == null || bucket.tokens >= 0) {
            return 0;
        }
        long now = System.currentTimeMillis();
        long windowMillis = windowSeconds * 1000;
        long elapsed = now - bucket.lastRefillTime;
        long remainingMillis = windowMillis - elapsed;
        return Math.max(1, remainingMillis / 1000);
    }

    private static class TokenBucket {
        double tokens;
        long lastRefillTime;

        TokenBucket(double tokens, long lastRefillTime) {
            this.tokens = tokens;
            this.lastRefillTime = lastRefillTime;
        }
    }
}
