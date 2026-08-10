package com.fitnessai.backend.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GymRequestDto {
    private String googlePlaceId;

    @NotBlank(message = "El nombre del gimnasio es obligatorio")
    private String name;

    private String address;
    private Double latitude;
    private Double longitude;
}
