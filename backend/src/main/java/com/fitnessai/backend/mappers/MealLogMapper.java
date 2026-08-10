package com.fitnessai.backend.mappers;

import com.fitnessai.backend.dtos.request.MealLogRequestDto;
import com.fitnessai.backend.dtos.response.MealLogResponseDto;
import com.fitnessai.backend.entities.MealLog;

public class MealLogMapper {
    public static MealLog toEntity(MealLogRequestDto dto) {
        if (dto == null) return null;
        MealLog log = new MealLog();
        log.setImageUrl(dto.getImageUrl());
        log.setMealType(MealLog.MealType.valueOf(dto.getMealType().toUpperCase()));
        log.setDetectedFoods(dto.getDetectedFoods());
        log.setTotalCalories(dto.getTotalCalories());
        log.setTotalProtein(dto.getTotalProtein());
        log.setTotalCarbs(dto.getTotalCarbs());
        log.setTotalFats(dto.getTotalFats());
        log.setLogDate(dto.getLogDate());
        return log;
    }
    public static MealLogResponseDto toResponseDto(MealLog log) {
        if (log == null) return null;
        MealLogResponseDto dto = new MealLogResponseDto();
        dto.setId(log.getId());
        if (log.getUser() != null) dto.setUserId(log.getUser().getId());
        dto.setImageUrl(log.getImageUrl());
        dto.setMealType(log.getMealType().name());
        dto.setDetectedFoods(log.getDetectedFoods());
        dto.setTotalCalories(log.getTotalCalories());
        dto.setTotalProtein(log.getTotalProtein());
        dto.setTotalCarbs(log.getTotalCarbs());
        dto.setTotalFats(log.getTotalFats());
        dto.setLogDate(log.getLogDate());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
