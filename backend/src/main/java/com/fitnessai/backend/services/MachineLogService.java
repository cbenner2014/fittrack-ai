package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.MachineLogRequestDto;
import com.fitnessai.backend.dtos.response.MachineLogResponseDto;

import java.util.List;

public interface MachineLogService {
    MachineLogResponseDto logMachine(Long authUserId, MachineLogRequestDto request);
    List<MachineLogResponseDto> getMachineLogsByUser(Long userId);
    void deleteMachineLog(Long authUserId, Long id);
}
