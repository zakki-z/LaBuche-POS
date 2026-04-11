package com.example.backend.controller;

import com.example.backend.dto.request.BadgeLoginRequest;
import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest request) {
        authService.registerUser(request);
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Login using an RFID badge number.
     * The badge reader sends the card UID; we look up the user by badge.
     */
    @PostMapping("/badge-login")
    public ResponseEntity<?> badgeLogin(@Valid @RequestBody BadgeLoginRequest request) {
        AuthResponse response = authService.loginByBadge(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Verify credentials without changing session.
     * Used by the frontend for on-demand auth prompts.
     * Returns the user info if credentials are valid.
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }
}