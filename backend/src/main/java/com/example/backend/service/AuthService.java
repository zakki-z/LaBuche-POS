package com.example.backend.service;

import com.example.backend.dto.request.LoginRequest;
import com.example.backend.dto.request.RegisterRequest;
import com.example.backend.dto.response.AuthResponse;
import com.example.backend.entity.ERole;
import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    public void registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new IllegalArgumentException("Username is already in use");
        }

        // Default role to USER if not provided
        ERole role = registerRequest.getRole() != null ? registerRequest.getRole() : ERole.USER;

        User user = User.builder()
                .username(registerRequest.getUsername())
                .password(registerRequest.getPassword())  // plain text, no hashing
                .fullName(registerRequest.getFullName())
                .email(registerRequest.getEmail())
                .role(role)
                .build();

        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!user.getPassword().equals(loginRequest.getPassword())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        return new AuthResponse(user.getUsername(), user.getRole().name());
    }
}