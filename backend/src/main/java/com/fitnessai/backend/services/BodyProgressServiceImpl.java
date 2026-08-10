package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.BodyProgressLogRequestDto;
import com.fitnessai.backend.dtos.response.BodyProgressLogResponseDto;
import com.fitnessai.backend.entities.BodyProgressLog;
import com.fitnessai.backend.entities.User;
import com.fitnessai.backend.mappers.BodyProgressMapper;
import com.fitnessai.backend.repositories.BodyProgressLogRepository;
import com.fitnessai.backend.repositories.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BodyProgressServiceImpl implements BodyProgressService {
    private final BodyProgressLogRepository repository;
    private final UserRepository userRepository;
    public BodyProgressServiceImpl(BodyProgressLogRepository repository, UserRepository userRepository) { 
        this.repository = repository; 
        this.userRepository = userRepository;
    }
    @Override
    public BodyProgressLogResponseDto createBodyProgress(BodyProgressLogRequestDto dto) {
        User user = userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        BodyProgressLog log = BodyProgressMapper.toEntity(dto);
        log.setUser(user);
        return BodyProgressMapper.toResponseDto(repository.save(log));
    }
    @Override
    public List<BodyProgressLogResponseDto> getProgressByUser(Long userId) {
        return repository.findByUserId(userId).stream().map(BodyProgressMapper::toResponseDto).collect(Collectors.toList());
    }
}
