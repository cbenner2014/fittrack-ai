package com.fitnessai.backend.dtos.response;

import lombok.Data;

@Data
public class ExerciseResponseDto {
    private Long id;
    private Long machineId;
    private String machineName;
    private Double weightLifted;
    private Integer repetitions;
    private Integer sets;
    private String imageUrl;
    private Double aiConfidenceScore;
}
