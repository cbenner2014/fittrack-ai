package com.fitnessai.backend.utils;

import com.fitnessai.backend.dtos.request.MachineLogRequestDto;
import com.fitnessai.backend.dtos.response.MachineLogResponseDto;
import com.fitnessai.backend.entities.MachineLog;

public class MachineLogMapper {

    public static MachineLog toEntity(MachineLogRequestDto dto) {
        if (dto == null) return null;
        MachineLog entity = new MachineLog();
        entity.setUserId(dto.getUserId());
        entity.setMachineName(dto.getMachineName());
        entity.setTargetMuscle(dto.getTargetMuscle());
        entity.setInstructions(dto.getInstructions());
        entity.setTips(dto.getTips());
        entity.setImageUrl(dto.getImageUrl());
        entity.setLogDate(dto.getLogDate());
        return entity;
    }

    public static MachineLogResponseDto toResponseDto(MachineLog entity) {
        if (entity == null) return null;
        MachineLogResponseDto dto = new MachineLogResponseDto();
        dto.setId(entity.getId());
        dto.setUserId(entity.getUserId());
        dto.setMachineName(entity.getMachineName());
        dto.setTargetMuscle(entity.getTargetMuscle());
        dto.setInstructions(entity.getInstructions());
        dto.setTips(entity.getTips());
        dto.setImageUrl(entity.getImageUrl());
        dto.setLogDate(entity.getLogDate());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
