package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.MachineRequestDto;
import com.fitnessai.backend.dtos.response.MachineResponseDto;
import java.util.List;

public interface MachineService {
    MachineResponseDto createMachine(MachineRequestDto dto);
    List<MachineResponseDto> getAllMachines();
}
