package com.example.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderDTO(Long id, BigDecimal quantity, BigDecimal totalPrice, LocalDateTime createdAt, String description) {
}
