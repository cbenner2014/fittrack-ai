package com.fitnessai.backend.dtos.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class BodyProgressLogRequestDto {
    @NotNull(message = "El ID del usuario es obligatorio")
    private Long userId;

    private String frontImageUrl;
    private String sideImageUrl;
    private Double recordedWeight;
    private Double aiEstimatedBodyFat;
    private String aiFeedbackNotes;

    @NotNull(message = "La fecha del registro es obligatoria")
    private LocalDate logDate;
}
