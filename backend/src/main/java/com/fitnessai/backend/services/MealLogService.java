package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.MealLogRequestDto;
import com.fitnessai.backend.dtos.response.MealLogResponseDto;
import java.util.List;

public interface MealLogService {
    MealLogResponseDto createMealLog(Long authUserId, MealLogRequestDto dto);
    List<MealLogResponseDto> getMealLogsByUser(Long userId);
    void deleteMealLog(Long authUserId, Long id);
}
