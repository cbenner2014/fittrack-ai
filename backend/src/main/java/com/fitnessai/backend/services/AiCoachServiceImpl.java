package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.AiCoachRecommendationRequestDto;
import com.fitnessai.backend.dtos.response.AiCoachRecommendationResponseDto;
import com.fitnessai.backend.entities.AiCoachRecommendation;
import com.fitnessai.backend.entities.User;
import com.fitnessai.backend.mappers.AiCoachMapper;
import com.fitnessai.backend.repositories.AiCoachRecommendationRepository;
import com.fitnessai.backend.repositories.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiCoachServiceImpl implements AiCoachService {
    private final AiCoachRecommendationRepository repository;
    private final UserRepository userRepository;
    public AiCoachServiceImpl(AiCoachRecommendationRepository repository, UserRepository userRepository) { 
        this.repository = repository; 
        this.userRepository = userRepository;
    }
    @Override
    public AiCoachRecommendationResponseDto createRecommendation(AiCoachRecommendationRequestDto dto) {
        User user = userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        AiCoachRecommendation rec = AiCoachMapper.toEntity(dto);
        rec.setUser(user);
        return AiCoachMapper.toResponseDto(repository.save(rec));
    }
    @Override
    public List<AiCoachRecommendationResponseDto> getRecommendationsByUser(Long userId) {
        return repository.findByUserId(userId).stream().map(AiCoachMapper::toResponseDto).collect(Collectors.toList());
    }
}
