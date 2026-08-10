package com.fitnessai.backend.dtos.response;

import lombok.Data;

@Data
public class GymResponseDto {
    private Long id;
    private String googlePlaceId;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
}
