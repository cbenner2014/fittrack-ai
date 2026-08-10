package com.fitnessai.backend.dtos.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class WorkoutResponseDto {
    private Long id;
    private Long userId;
    private Long gymId;
    private String gymName;
    private LocalDate sessionDate;
    private String notes;
    private LocalDateTime createdAt;
    private List<ExerciseResponseDto> exercises;
}
