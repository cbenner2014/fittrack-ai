package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.GymRequestDto;
import com.fitnessai.backend.dtos.response.GymResponseDto;
import java.util.List;

public interface GymService {
    GymResponseDto createGym(GymRequestDto dto);
    List<GymResponseDto> getAllGyms();
}
