package com.fitnessai.backend.dtos.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UserRequestDto {
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "Debe ser un email válido")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    private String password;

    @NotBlank(message = "El nombre completo es obligatorio")
    private String fullName;

    private String avatarUrl;

    private Double initialWeight;
    private Double currentWeight;
    private Double height;
    private String goal; // LOSE_WEIGHT, GAIN_MUSCLE, MAINTAIN
    
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
}
