package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.BodyProgressLogRequestDto;
import com.fitnessai.backend.dtos.response.BodyProgressLogResponseDto;
import com.fitnessai.backend.services.BodyProgressService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/body-progress")
public class BodyProgressController {
    private final BodyProgressService service;

    public BodyProgressController(BodyProgressService service) { 
        this.service = service; 
    }

    @PostMapping
    public ResponseEntity<BodyProgressLogResponseDto> createProgress(
            @RequestAttribute("userId") Long authUserId,
            @Valid @RequestBody BodyProgressLogRequestDto dto) {
        return ResponseEntity.ok(service.createBodyProgress(authUserId, dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BodyProgressLogResponseDto>> getProgressByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getProgressByUser(userId));
    }
}
