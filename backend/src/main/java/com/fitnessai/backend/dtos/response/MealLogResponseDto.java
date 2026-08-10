package com.fitnessai.backend.dtos.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MealLogResponseDto {
    private Long id;
    private Long userId;
    private String imageUrl;
    private String mealType;
    private String detectedFoods;
    private Integer totalCalories;
    private Double totalProtein;
    private Double totalCarbs;
    private Double totalFats;
    private LocalDate logDate;
    private LocalDateTime createdAt;
}
