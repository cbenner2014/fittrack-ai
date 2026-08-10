package com.fitnessai.backend.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiCoachRecommendationRequestDto {
    @NotNull(message = "El ID del usuario es obligatorio")
    private Long userId;

    @NotBlank(message = "El tipo de recomendación es obligatorio")
    private String recommendationType;

    private String content; // JSON String
    private Boolean isApplied = false;
}
