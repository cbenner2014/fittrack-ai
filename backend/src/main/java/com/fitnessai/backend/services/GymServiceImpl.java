package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.GymRequestDto;
import com.fitnessai.backend.dtos.response.GymResponseDto;
import com.fitnessai.backend.entities.Gym;
import com.fitnessai.backend.mappers.GymMapper;
import com.fitnessai.backend.repositories.GymRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GymServiceImpl implements GymService {
    private final GymRepository repository;
    public GymServiceImpl(GymRepository repository) { this.repository = repository; }
    @Override
    public GymResponseDto createGym(GymRequestDto dto) {
        Gym saved = repository.save(GymMapper.toEntity(dto));
        return GymMapper.toResponseDto(saved);
    }
    @Override
    public List<GymResponseDto> getAllGyms() {
        return repository.findAll().stream().map(GymMapper::toResponseDto).collect(Collectors.toList());
    }
}
