package com.fintrack.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        System.out.println("----------------------------------------");
        System.out.println("JWT FILTER");
        System.out.println("Request: " + request.getMethod()
                + " " + request.getRequestURI());
        System.out.println("Authorization: " + authHeader);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {

            System.out.println("JWT FILTER: No Bearer token");

            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        try {

            if (!jwtService.isValid(token)) {

                System.out.println("JWT FILTER: INVALID TOKEN");

                filterChain.doFilter(request, response);
                return;
            }

            String email = jwtService.extractEmail(token);

            System.out.println("JWT FILTER: VALID TOKEN");
            System.out.println("JWT FILTER: Email = " + email);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            Collections.emptyList()
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource()
                            .buildDetails(request)
            );

            SecurityContextHolder
                    .getContext()
                    .setAuthentication(authentication);

            System.out.println(
                    "JWT FILTER: Authentication set = "
                            + SecurityContextHolder
                            .getContext()
                            .getAuthentication()
            );

        } catch (Exception e) {

            System.out.println(
                    "JWT FILTER ERROR: "
                            + e.getClass().getName()
            );

            System.out.println(
                    "JWT FILTER ERROR MESSAGE: "
                            + e.getMessage()
            );
        }

        filterChain.doFilter(request, response);
    }
}