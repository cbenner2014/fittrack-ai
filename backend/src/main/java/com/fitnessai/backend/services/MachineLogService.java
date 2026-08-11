package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.MachineLogRequestDto;
import com.fitnessai.backend.dtos.response.MachineLogResponseDto;
import java.util.List;

public interface MachineLogService {
    MachineLogResponseDto logMachine(MachineLogRequestDto requestDto);
    List<MachineLogResponseDto> getMachineLogsByUser(Long userId);
    void deleteMachineLog(Long id);
}
