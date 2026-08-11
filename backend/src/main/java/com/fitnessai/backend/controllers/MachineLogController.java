package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.MachineLogRequestDto;
import com.fitnessai.backend.dtos.response.MachineLogResponseDto;
import com.fitnessai.backend.services.MachineLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/machine-logs")
public class MachineLogController {

    private final MachineLogService service;

    public MachineLogController(MachineLogService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<MachineLogResponseDto> logMachine(@RequestBody MachineLogRequestDto request) {
        return ResponseEntity.ok(service.logMachine(request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MachineLogResponseDto>> getMachinesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getMachineLogsByUser(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMachineLog(@PathVariable Long id) {
        service.deleteMachineLog(id);
        return ResponseEntity.noContent().build();
    }
}
