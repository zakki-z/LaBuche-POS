package com.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BadgeLoginRequest {
    @NotBlank(message = "Badge number is required")
    private String badgeNumber;
}