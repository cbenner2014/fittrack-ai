package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.MealLogRequestDto;
import com.fitnessai.backend.dtos.response.MealLogResponseDto;
import java.util.List;

public interface MealLogService {
    MealLogResponseDto createMealLog(MealLogRequestDto dto);
    List<MealLogResponseDto> getMealLogsByUser(Long userId);
}
