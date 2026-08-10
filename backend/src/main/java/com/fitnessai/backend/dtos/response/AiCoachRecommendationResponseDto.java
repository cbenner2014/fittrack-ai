package com.fitnessai.backend.dtos.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AiCoachRecommendationResponseDto {
    private Long id;
    private Long userId;
    private String recommendationType;
    private String content;
    private Boolean isApplied;
    private LocalDateTime createdAt;
}
