package com.fitnessai.backend.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class MachineRequestDto {
    @NotBlank(message = "El nombre de la máquina es obligatorio")
    private String name;
    private String targetMuscleGroup;
}
