package com.fitnessai.backend.dtos.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ExerciseRequestDto {
    @NotNull(message = "El ID de la máquina es obligatorio")
    private Long machineId;

    @NotNull(message = "El peso levantado es obligatorio")
    private Double weightLifted;

    @NotNull(message = "Las repeticiones son obligatorias")
    private Integer repetitions;

    private Integer sets = 1;
    private String imageUrl;
}
