package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.AiCoachRecommendationRequestDto;
import com.fitnessai.backend.dtos.response.AiCoachRecommendationResponseDto;
import java.util.List;

public interface AiCoachService {
    AiCoachRecommendationResponseDto createRecommendation(AiCoachRecommendationRequestDto dto);
    List<AiCoachRecommendationResponseDto> getRecommendationsByUser(Long userId);
}
