package com.example.backend.config;

import com.example.backend.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility to retrieve the current user from the request attribute.
 * Returns null if no user is authenticated (anonymous access).
 */
@Component
public class CurrentUserProvider {

    public User getCurrentUser() {
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs == null) return null;
        HttpServletRequest request = attrs.getRequest();
        return (User) request.getAttribute("currentUser");
    }

    /**
     * Returns the current user or throws if not authenticated.
     * Use this in endpoints that require authentication.
     */
    public User requireCurrentUser() {
        User user = getCurrentUser();
        if (user == null) {
            throw new IllegalStateException("Authentication required");
        }
        return user;
    }

    public String getCurrentUsername() {
        User user = getCurrentUser();
        return user != null ? user.getUsername() : null;
    }
}