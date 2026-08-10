package com.fitnessai.backend.dtos.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class WorkoutRequestDto {
    @NotNull(message = "El ID del usuario es obligatorio")
    private Long userId;

    private Long gymId;

    @NotNull(message = "La fecha de la sesión es obligatoria")
    private LocalDate sessionDate;

    private String notes;

    @Valid
    private List<ExerciseRequestDto> exercises;
}
