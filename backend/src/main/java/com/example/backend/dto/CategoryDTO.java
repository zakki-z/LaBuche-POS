package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;

public record CategoryDTO(Long id, @NotBlank String name, String role, Long orderId){
}
