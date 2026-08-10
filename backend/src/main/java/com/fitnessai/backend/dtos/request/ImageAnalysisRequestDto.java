package com.fitnessai.backend.dtos.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ImageAnalysisRequestDto {
    @NotBlank(message = "La imagen en Base64 es obligatoria")
    private String base64Image;
}
