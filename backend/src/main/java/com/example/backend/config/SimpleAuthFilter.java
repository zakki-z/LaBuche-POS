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

/**
 * Non-blocking filter: if X-Username header is present and valid,
 * attaches the User to the request. Otherwise, the request continues
 * without a user (anonymous access).
 *
 * Individual controllers/services decide whether a user is required.
 */
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

        // Allow CORS preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            chain.doFilter(request, servletResponse);
            return;
        }

        String username = request.getHeader("X-Username");

        if (username != null && !username.isBlank()) {
            Optional<User> userOpt = userRepository.findByUsername(username);
            userOpt.ifPresent(user -> request.setAttribute("currentUser", user));
        }

        // Always continue — no blocking
        chain.doFilter(request, servletResponse);
    }
}