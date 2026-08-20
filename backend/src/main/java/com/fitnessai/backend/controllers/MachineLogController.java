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
    public ResponseEntity<MachineLogResponseDto> logMachine(
            @RequestAttribute("userId") Long authUserId,
            @RequestBody MachineLogRequestDto request) {
        return ResponseEntity.ok(service.logMachine(authUserId, request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MachineLogResponseDto>> getMachinesByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getMachineLogsByUser(userId));
    }

    @PutMapping("/{id}/weight")
    public ResponseEntity<MachineLogResponseDto> updateMachineWeight(
            @RequestAttribute("userId") Long authUserId,
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String weightLog = payload.get("weightLog");
        return ResponseEntity.ok(service.updateMachineWeight(authUserId, id, weightLog));
    }

    @PutMapping("/{id}/routine-days")
    public ResponseEntity<MachineLogResponseDto> updateMachineRoutineDays(
            @RequestAttribute("userId") Long authUserId,
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String routineDays = payload.get("routineDays");
        return ResponseEntity.ok(service.updateMachineRoutineDays(authUserId, id, routineDays));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMachineLog(
            @RequestAttribute("userId") Long authUserId,
            @PathVariable Long id) {
        service.deleteMachineLog(authUserId, id);
        return ResponseEntity.noContent().build();
    }
}
