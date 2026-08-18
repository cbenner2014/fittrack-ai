package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.BodyProgressLogRequestDto;
import com.fitnessai.backend.dtos.response.BodyProgressLogResponseDto;
import java.util.List;

public interface BodyProgressService {
    BodyProgressLogResponseDto createBodyProgress(Long authUserId, BodyProgressLogRequestDto dto);
    List<BodyProgressLogResponseDto> getProgressByUser(Long userId);
}
