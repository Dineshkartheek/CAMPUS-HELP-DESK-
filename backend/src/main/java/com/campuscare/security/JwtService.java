package com.campuscare.security;

import com.campuscare.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;

/**
 * Creates and validates JSON Web Tokens.
 *
 * The signing secret comes from the JWT_SECRET environment variable.
 * In local development (dev/test profiles) a random secret is generated when
 * JWT_SECRET is missing. In production the application refuses to start
 * without a proper secret, which prevents accidentally shipping a weak key.
 */
@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey signingKey;
    private final long expirationMs;

    public JwtService(@Value("${app.jwt.secret:}") String configuredSecret,
                      @Value("${app.jwt.expiration-ms:86400000}") long expirationMs,
                      Environment environment) {
        this.expirationMs = expirationMs;
        this.signingKey = buildKey(configuredSecret, environment);
    }

    private SecretKey buildKey(String configuredSecret, Environment environment) {
        boolean localProfile = environment.acceptsProfiles(Profiles.of("dev", "test"));

        if (configuredSecret == null || configuredSecret.isBlank()) {
            if (!localProfile) {
                throw new IllegalStateException(
                        "JWT_SECRET is not configured. Set a long random JWT_SECRET environment variable.");
            }
            byte[] randomBytes = new byte[64];
            new SecureRandom().nextBytes(randomBytes);
            log.warn("JWT_SECRET is not set. A temporary random development secret was generated. "
                    + "All tokens become invalid after a restart.");
            return Keys.hmacShaKeyFor(randomBytes);
        }

        byte[] keyBytes;
        try {
            // Accept either Base64 or plain text secrets. Plain text must be long enough.
            keyBytes = Decoders.BASE64.decode(configuredSecret);
            if (keyBytes.length < 32) {
                keyBytes = configuredSecret.getBytes(StandardCharsets.UTF_8);
            }
        } catch (RuntimeException ex) {
            keyBytes = configuredSecret.getBytes(StandardCharsets.UTF_8);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes long.");
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiresAt = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("uid", user.getId())
                .claim("role", user.getRole().name())
                .issuedAt(now)
                .expiration(expiresAt)
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            Claims claims = parseClaims(token);
            return claims.getSubject().equalsIgnoreCase(userDetails.getUsername())
                    && claims.getExpiration().after(new Date());
        } catch (RuntimeException ex) {
            return false;
        }
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
