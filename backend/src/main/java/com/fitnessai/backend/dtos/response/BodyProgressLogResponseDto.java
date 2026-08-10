package com.fitnessai.backend.dtos.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class BodyProgressLogResponseDto {
    private Long id;
    private Long userId;
    private String frontImageUrl;
    private String sideImageUrl;
    private Double recordedWeight;
    private Double aiEstimatedBodyFat;
    private String aiFeedbackNotes;
    private LocalDate logDate;
    private LocalDateTime createdAt;
}
