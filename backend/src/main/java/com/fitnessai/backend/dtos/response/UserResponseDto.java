package com.fitnessai.backend.dtos.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserResponseDto {
    private Long id;
    private String email;
    private String fullName;
    private Double currentWeight;
    private Double height;
    private String goal;
    private LocalDateTime createdAt;
}
