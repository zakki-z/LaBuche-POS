package com.example.backend.config;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Optional;

@Component
@Order(1)
public class SimpleAuthFilter implements Filter {

    private final UserRepository userRepository;

    public SimpleAuthFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String path = request.getRequestURI();

        // Allow auth endpoints and OPTIONS (CORS preflight) without any header
        if (path.startsWith("/api/auth") || "OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, response);
            return;
        }

        String username = request.getHeader("X-Username");

        if (username == null || username.isBlank()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Missing X-Username header\"}");
            return;
        }

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"User not found\"}");
            return;
        }

        request.setAttribute("currentUser", userOpt.get());
        chain.doFilter(request, response);
    }
}