package com.fitnessai.backend.mappers;

import com.fitnessai.backend.dtos.request.MachineRequestDto;
import com.fitnessai.backend.dtos.response.MachineResponseDto;
import com.fitnessai.backend.entities.Machine;

public class MachineMapper {
    public static Machine toEntity(MachineRequestDto dto) {
        if (dto == null) return null;
        Machine machine = new Machine();
        machine.setName(dto.getName());
        machine.setTargetMuscleGroup(dto.getTargetMuscleGroup());
        return machine;
    }
    public static MachineResponseDto toResponseDto(Machine machine) {
        if (machine == null) return null;
        MachineResponseDto dto = new MachineResponseDto();
        dto.setId(machine.getId());
        dto.setName(machine.getName());
        dto.setTargetMuscleGroup(machine.getTargetMuscleGroup());
        return dto;
    }
}
