package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.WorkoutRequestDto;
import com.fitnessai.backend.dtos.response.WorkoutResponseDto;

import java.util.List;

public interface WorkoutService {
    WorkoutResponseDto createWorkout(WorkoutRequestDto workoutRequestDto);
    WorkoutResponseDto getWorkoutById(Long id);
    List<WorkoutResponseDto> getWorkoutsByUserId(Long userId);
}
