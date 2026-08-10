package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.GymRequestDto;
import com.fitnessai.backend.dtos.response.GymResponseDto;
import com.fitnessai.backend.services.GymService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/gyms")
public class GymController {
    private final GymService service;
    public GymController(GymService service) { this.service = service; }
    @PostMapping
    public ResponseEntity<GymResponseDto> createGym(@Valid @RequestBody GymRequestDto dto) {
        return ResponseEntity.ok(service.createGym(dto));
    }
    @GetMapping
    public ResponseEntity<List<GymResponseDto>> getAllGyms() {
        return ResponseEntity.ok(service.getAllGyms());
    }
}
