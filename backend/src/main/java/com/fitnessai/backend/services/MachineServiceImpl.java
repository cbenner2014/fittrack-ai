package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.MachineRequestDto;
import com.fitnessai.backend.dtos.response.MachineResponseDto;
import com.fitnessai.backend.entities.Machine;
import com.fitnessai.backend.mappers.MachineMapper;
import com.fitnessai.backend.repositories.MachineRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MachineServiceImpl implements MachineService {
    private final MachineRepository repository;
    public MachineServiceImpl(MachineRepository repository) { this.repository = repository; }
    @Override
    public MachineResponseDto createMachine(MachineRequestDto dto) {
        Machine saved = repository.save(MachineMapper.toEntity(dto));
        return MachineMapper.toResponseDto(saved);
    }
    @Override
    public List<MachineResponseDto> getAllMachines() {
        return repository.findAll().stream().map(MachineMapper::toResponseDto).collect(Collectors.toList());
    }
}
