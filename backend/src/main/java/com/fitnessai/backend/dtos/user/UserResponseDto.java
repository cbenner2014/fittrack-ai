package com.fitnessai.backend.dtos.user;

import com.fitnessai.backend.entities.User.Goal;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponseDto {
    private Long id;
    private String email;
    private String fullName;
    private Double currentWeight;
    private Double height;
    private Goal goal;
}
