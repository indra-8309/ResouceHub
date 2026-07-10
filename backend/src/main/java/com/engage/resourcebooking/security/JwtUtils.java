package com.engage.resourcebooking.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-minutes}")
    private int jwtExpirationMinutes;

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();

        return Jwts.builder()
                .subject((userPrincipal.getEmail()))
                .claim("sub", userPrincipal.getEmail())
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + (long) jwtExpirationMinutes * 60 * 1000))
                .signWith(key())
                .compact();
    }
    
    public String generateJwtToken(String email) {
        return Jwts.builder()
                .subject(email)
                .claim("sub", email)
                .issuedAt(new Date())
                .expiration(new Date((new Date()).getTime() + (long) jwtExpirationMinutes * 60 * 1000))
                .signWith(key())
                .compact();
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser().verifyWith(key()).build()
               .parseSignedClaims(token).getPayload().getSubject();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().verifyWith(key()).build().parse(authToken);
            return true;
        } catch (MalformedJwtException | ExpiredJwtException | UnsupportedJwtException | IllegalArgumentException e) {
            System.err.println("Invalid JWT token: " + e.getMessage());
        }

        return false;
    }
}
