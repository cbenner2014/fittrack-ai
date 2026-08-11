package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.MealLogRequestDto;
import com.fitnessai.backend.dtos.response.MealLogResponseDto;
import com.fitnessai.backend.entities.MealLog;
import com.fitnessai.backend.entities.User;
import com.fitnessai.backend.mappers.MealLogMapper;
import com.fitnessai.backend.repositories.MealLogRepository;
import com.fitnessai.backend.repositories.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MealLogServiceImpl implements MealLogService {
    private final MealLogRepository repository;
    private final UserRepository userRepository;
    public MealLogServiceImpl(MealLogRepository repository, UserRepository userRepository) { 
        this.repository = repository; 
        this.userRepository = userRepository;
    }
    @Override
    public MealLogResponseDto createMealLog(MealLogRequestDto dto) {
        User user = userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found"));
        MealLog log = MealLogMapper.toEntity(dto);
        log.setUser(user);
        return MealLogMapper.toResponseDto(repository.save(log));
    }
    @Override
    public List<MealLogResponseDto> getMealLogsByUser(Long userId) {
        return repository.findByUserId(userId).stream().map(MealLogMapper::toResponseDto).collect(Collectors.toList());
    }
    @Override
    public void deleteMealLog(Long id) {
        repository.deleteById(id);
    }
}
