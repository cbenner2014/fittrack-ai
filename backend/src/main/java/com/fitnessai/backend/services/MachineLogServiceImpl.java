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
    public MachineLogResponseDto logMachine(Long authUserId, MachineLogRequestDto requestDto) {
        // Forzar el userId del usuario autenticado para evitar spoofing
        requestDto.setUserId(authUserId);
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
    public MachineLogResponseDto updateMachineWeight(Long authUserId, Long id, String weightLog) {
        MachineLog log = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de máquina no encontrado con ID: " + id));

        // Verificación estricta de propiedad (Anti-BOLA)
        if (!log.getUserId().equals(authUserId)) {
            throw new RuntimeException("Acceso Denegado: No tienes permisos para actualizar este registro.");
        }

        log.setWeightLog(weightLog);
        MachineLog updated = repository.save(log);
        return MachineLogMapper.toResponseDto(updated);
    }

    @Override
    public MachineLogResponseDto updateMachineRoutineDays(Long authUserId, Long id, String routineDays) {
        MachineLog log = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de máquina no encontrado con ID: " + id));

        // Verificación estricta de propiedad (Anti-BOLA)
        if (!log.getUserId().equals(authUserId)) {
            throw new RuntimeException("Acceso Denegado: No tienes permisos para actualizar este registro.");
        }

        log.setRoutineDays(routineDays);
        MachineLog updated = repository.save(log);
        return MachineLogMapper.toResponseDto(updated);
    }

    @Override
    public void deleteMachineLog(Long authUserId, Long id) {
        MachineLog log = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Registro de máquina no encontrado con ID: " + id));

        // Verificación estricta de propiedad (Anti-BOLA)
        if (!log.getUserId().equals(authUserId)) {
            throw new RuntimeException("Acceso Denegado: No tienes permisos para eliminar este registro.");
        }

        repository.delete(log);
    }
}
