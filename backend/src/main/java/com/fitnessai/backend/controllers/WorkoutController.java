package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.WorkoutRequestDto;
import com.fitnessai.backend.dtos.response.WorkoutResponseDto;
import com.fitnessai.backend.services.WorkoutService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/workouts")
public class WorkoutController {

    private final WorkoutService workoutService;

    @Autowired
    public WorkoutController(WorkoutService workoutService) {
        this.workoutService = workoutService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createWorkout(@Valid @RequestBody WorkoutRequestDto workoutRequestDto) {
        WorkoutResponseDto createdWorkout = workoutService.createWorkout(workoutRequestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Sesión de entrenamiento creada exitosamente",
                "data", createdWorkout
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getWorkoutById(@PathVariable Long id) {
        WorkoutResponseDto workout = workoutService.getWorkoutById(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", workout
        ));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getWorkoutsByUserId(@PathVariable Long userId) {
        List<WorkoutResponseDto> workouts = workoutService.getWorkoutsByUserId(userId);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Entrenamientos obtenidos correctamente",
                "data", workouts
        ));
    }
}
