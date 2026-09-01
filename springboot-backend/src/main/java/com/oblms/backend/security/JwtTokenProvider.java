package com.oblms.backend.security;

import com.oblms.backend.model.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    // 256-bit secure secret key for HMAC-SHA256 signature
    private static final String JWT_SECRET = "OBLMS_Enterprise_Secure_Secret_Key_2026_Advanced_Outcome_Based_Learning_System_JWT_Token_Key";
    private static final long JWT_EXPIRATION_MS = 24 * 60 * 60 * 1000L; // 24 Hours

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + JWT_EXPIRATION_MS);

        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("name", user.getName());
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().toUpperCase());
        claims.put("department", user.getDepartment() != null ? user.getDepartment() : "General");

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(user.getId())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            System.err.println("Invalid JWT signature or expired token: " + e.getMessage());
            return false;
        }
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String getUserIdFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return (String) claims.get("role");
    }

    public String getEmailFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        return (String) claims.get("email");
    }
}
