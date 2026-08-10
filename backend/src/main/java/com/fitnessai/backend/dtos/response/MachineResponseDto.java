package com.fitnessai.backend.dtos.response;

import lombok.Data;

@Data
public class MachineResponseDto {
    private Long id;
    private String name;
    private String targetMuscleGroup;
}
