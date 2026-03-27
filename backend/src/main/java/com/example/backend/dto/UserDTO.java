package com.example.backend.dto;

import jakarta.validation.constraints.NotNull;

public record UserDTO(Long id, @NotNull String username) {
}
