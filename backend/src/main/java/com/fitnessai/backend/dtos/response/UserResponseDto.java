package com.fitnessai.backend.dtos.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponseDto {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String avatarUrl;
    private Double currentWeight;
    private Double height;
    private String goal;
    
    private Integer age;
    private String gender;
    private Double activityLevel;
    
    private Integer baseCalories;
    private Integer dailyCaloriesTarget;
    private Integer dailyProteinTarget;
    private Integer dailyCarbsTarget;
    private Integer dailyFatsTarget;
    
    private Integer xp;
    private Integer level;

    private LocalDateTime createdAt;
}
