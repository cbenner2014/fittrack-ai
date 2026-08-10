package com.fitnessai.backend.mappers;

import com.fitnessai.backend.dtos.request.AiCoachRecommendationRequestDto;
import com.fitnessai.backend.dtos.response.AiCoachRecommendationResponseDto;
import com.fitnessai.backend.entities.AiCoachRecommendation;

public class AiCoachMapper {
    public static AiCoachRecommendation toEntity(AiCoachRecommendationRequestDto dto) {
        if (dto == null) return null;
        AiCoachRecommendation rec = new AiCoachRecommendation();
        rec.setRecommendationType(AiCoachRecommendation.RecommendationType.valueOf(dto.getRecommendationType().toUpperCase()));
        rec.setContent(dto.getContent());
        rec.setIsApplied(dto.getIsApplied());
        return rec;
    }
    public static AiCoachRecommendationResponseDto toResponseDto(AiCoachRecommendation rec) {
        if (rec == null) return null;
        AiCoachRecommendationResponseDto dto = new AiCoachRecommendationResponseDto();
        dto.setId(rec.getId());
        if (rec.getUser() != null) dto.setUserId(rec.getUser().getId());
        dto.setRecommendationType(rec.getRecommendationType().name());
        dto.setContent(rec.getContent());
        dto.setIsApplied(rec.getIsApplied());
        dto.setCreatedAt(rec.getCreatedAt());
        return dto;
    }
}
