package com.oblms.backend.security;

import com.oblms.backend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
    }

    @Test
    @DisplayName("Should generate valid HMAC-SHA256 signed JWT token for User")
    void testGenerateToken() {
        User testUser = new User("STU004", "Krishnavamsi", "krishnavamsi@gmail.com", "password", "STUDENT", "Computer Science & Engineering");

        String token = jwtTokenProvider.generateToken(testUser);

        assertNotNull(token);
        assertFalse(token.isEmpty());
        assertTrue(token.split("\\.").length == 3, "JWT should consist of header, payload, and signature segments");
    }

    @Test
    @DisplayName("Should validate genuine token and reject tampered token")
    void testValidateToken() {
        User testUser = new User("FAC001", "Dr. Ramesh Babu", "ramesh.babu@oblms.edu", "password", "FACULTY", "Computer Science & Engineering");
        String token = jwtTokenProvider.generateToken(testUser);

        assertTrue(jwtTokenProvider.validateToken(token));
        assertFalse(jwtTokenProvider.validateToken(token + "tamperedFakeSignature"));
        assertFalse(jwtTokenProvider.validateToken("invalid.jwt.token"));
    }

    @Test
    @DisplayName("Should extract correct claims from JWT token")
    void testExtractClaims() {
        User testUser = new User("ADM001", "Dr. K. S. Rao", "admin@oblms.edu", "root", "ADMIN", "System Administration");
        String token = jwtTokenProvider.generateToken(testUser);

        assertEquals("ADM001", jwtTokenProvider.getUserIdFromToken(token));
        assertEquals("ADMIN", jwtTokenProvider.getRoleFromToken(token));
        assertEquals("admin@oblms.edu", jwtTokenProvider.getEmailFromToken(token));
    }
}
