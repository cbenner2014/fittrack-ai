package com.fitnessai.backend.mappers;

import com.fitnessai.backend.dtos.request.BodyProgressLogRequestDto;
import com.fitnessai.backend.dtos.response.BodyProgressLogResponseDto;
import com.fitnessai.backend.entities.BodyProgressLog;

public class BodyProgressMapper {
    public static BodyProgressLog toEntity(BodyProgressLogRequestDto dto) {
        if (dto == null) return null;
        BodyProgressLog log = new BodyProgressLog();
        log.setFrontImageUrl(dto.getFrontImageUrl());
        log.setSideImageUrl(dto.getSideImageUrl());
        log.setRecordedWeight(dto.getRecordedWeight());
        log.setAiEstimatedBodyFat(dto.getAiEstimatedBodyFat());
        log.setAiFeedbackNotes(dto.getAiFeedbackNotes());
        log.setLogDate(dto.getLogDate());
        return log;
    }
    public static BodyProgressLogResponseDto toResponseDto(BodyProgressLog log) {
        if (log == null) return null;
        BodyProgressLogResponseDto dto = new BodyProgressLogResponseDto();
        dto.setId(log.getId());
        if (log.getUser() != null) dto.setUserId(log.getUser().getId());
        dto.setFrontImageUrl(log.getFrontImageUrl());
        dto.setSideImageUrl(log.getSideImageUrl());
        dto.setRecordedWeight(log.getRecordedWeight());
        dto.setAiEstimatedBodyFat(log.getAiEstimatedBodyFat());
        dto.setAiFeedbackNotes(log.getAiFeedbackNotes());
        dto.setLogDate(log.getLogDate());
        dto.setCreatedAt(log.getCreatedAt());
        return dto;
    }
}
