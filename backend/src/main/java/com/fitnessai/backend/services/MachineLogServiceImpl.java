package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.MachineLogRequestDto;
import com.fitnessai.backend.dtos.response.MachineLogResponseDto;
import com.fitnessai.backend.entities.MachineLog;
import com.fitnessai.backend.repositories.MachineLogRepository;
import com.fitnessai.backend.utils.MachineLogMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class MachineLogServiceImpl implements MachineLogService {

    private final MachineLogRepository repository;

    public MachineLogServiceImpl(MachineLogRepository repository) {
        this.repository = repository;
    }

    @Override
    public MachineLogResponseDto logMachine(MachineLogRequestDto requestDto) {
        MachineLog entity = MachineLogMapper.toEntity(requestDto);
        MachineLog saved = repository.save(entity);
        return MachineLogMapper.toResponseDto(saved);
    }

    @Override
    public List<MachineLogResponseDto> getMachineLogsByUser(Long userId) {
        return repository.findByUserId(userId).stream()
                .map(MachineLogMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteMachineLog(Long id) {
        repository.deleteById(id);
    }
}
