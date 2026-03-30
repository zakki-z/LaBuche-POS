package com.example.backend.config;

import com.example.backend.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility to retrieve the current authenticated user from the request attribute
 * set by SimpleAuthFilter.
 */
@Component
public class CurrentUserProvider {

    public User getCurrentUser() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) {
            throw new IllegalStateException("No request context available");
        }
        HttpServletRequest request = attrs.getRequest();
        User user = (User) request.getAttribute("currentUser");
        if (user == null) {
            throw new IllegalStateException("No authenticated user in request");
        }
        return user;
    }

    public String getCurrentUsername() {
        return getCurrentUser().getUsername();
    }
}