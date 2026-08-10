package com.fitnessai.backend.dtos.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MealLogRequestDto {
    @NotNull(message = "El ID del usuario es obligatorio")
    private Long userId;

    @NotBlank(message = "La imagen de la comida es obligatoria")
    private String imageUrl;

    @NotBlank(message = "El tipo de comida es obligatorio (BREAKFAST, LUNCH, DINNER, SNACK)")
    private String mealType;

    private String detectedFoods; // JSON String
    private Integer totalCalories;
    private Double totalProtein;
    private Double totalCarbs;
    private Double totalFats;
    
    @NotNull(message = "La fecha es obligatoria")
    private LocalDate logDate;
}
