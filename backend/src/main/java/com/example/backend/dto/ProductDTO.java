package com.example.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record ProductDTO(Long id, @NotBlank String name,@Positive BigDecimal price, Long categoryId, String categoryName) {
}
