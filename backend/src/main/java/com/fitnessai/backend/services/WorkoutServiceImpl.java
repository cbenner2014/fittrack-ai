package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.ExerciseRequestDto;
import com.fitnessai.backend.dtos.request.WorkoutRequestDto;
import com.fitnessai.backend.dtos.response.ExerciseResponseDto;
import com.fitnessai.backend.dtos.response.WorkoutResponseDto;
import com.fitnessai.backend.entities.ExerciseLog;
import com.fitnessai.backend.entities.Gym;
import com.fitnessai.backend.entities.Machine;
import com.fitnessai.backend.entities.User;
import com.fitnessai.backend.entities.WorkoutSession;
import com.fitnessai.backend.mappers.WorkoutMapper;
import com.fitnessai.backend.repositories.ExerciseLogRepository;
import com.fitnessai.backend.repositories.GymRepository;
import com.fitnessai.backend.repositories.MachineRepository;
import com.fitnessai.backend.repositories.UserRepository;
import com.fitnessai.backend.repositories.WorkoutSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WorkoutServiceImpl implements WorkoutService {

    private final WorkoutSessionRepository workoutSessionRepository;
    private final ExerciseLogRepository exerciseLogRepository;
    private final UserRepository userRepository;
    private final GymRepository gymRepository;
    private final MachineRepository machineRepository;

    @Autowired
    public WorkoutServiceImpl(WorkoutSessionRepository workoutSessionRepository,
                              ExerciseLogRepository exerciseLogRepository,
                              UserRepository userRepository,
                              GymRepository gymRepository,
                              MachineRepository machineRepository) {
        this.workoutSessionRepository = workoutSessionRepository;
        this.exerciseLogRepository = exerciseLogRepository;
        this.userRepository = userRepository;
        this.gymRepository = gymRepository;
        this.machineRepository = machineRepository;
    }

    @Override
    @Transactional
    public WorkoutResponseDto createWorkout(WorkoutRequestDto dto) {
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Gym gym = null;
        if (dto.getGymId() != null) {
            gym = gymRepository.findById(dto.getGymId())
                    .orElseThrow(() -> new RuntimeException("Gimnasio no encontrado"));
        }

        WorkoutSession session = WorkoutMapper.toEntity(dto);
        session.setUser(user);
        session.setGym(gym);
        
        WorkoutSession savedSession = workoutSessionRepository.save(session);
        WorkoutResponseDto responseDto = WorkoutMapper.toResponseDto(savedSession);
        
        if (dto.getExercises() != null && !dto.getExercises().isEmpty()) {
            List<ExerciseResponseDto> savedExercises = dto.getExercises().stream().map(exDto -> {
                Machine machine = machineRepository.findById(exDto.getMachineId())
                        .orElseThrow(() -> new RuntimeException("Máquina no encontrada"));
                
                ExerciseLog exercise = WorkoutMapper.toEntity(exDto);
                exercise.setWorkoutSession(savedSession);
                exercise.setMachine(machine);
                
                return WorkoutMapper.toResponseDto(exerciseLogRepository.save(exercise));
            }).collect(Collectors.toList());
            
            responseDto.setExercises(savedExercises);
        }

        return responseDto;
    }

    @Override
    public WorkoutResponseDto getWorkoutById(Long id) {
        WorkoutSession session = workoutSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sesión no encontrada"));
        
        WorkoutResponseDto dto = WorkoutMapper.toResponseDto(session);
        List<ExerciseLog> exercises = exerciseLogRepository.findByWorkoutSessionId(id);
        dto.setExercises(exercises.stream().map(WorkoutMapper::toResponseDto).collect(Collectors.toList()));
        return dto;
    }

    @Override
    public List<WorkoutResponseDto> getWorkoutsByUserId(Long userId) {
        return workoutSessionRepository.findByUserId(userId).stream().map(session -> {
            WorkoutResponseDto dto = WorkoutMapper.toResponseDto(session);
            List<ExerciseLog> exercises = exerciseLogRepository.findByWorkoutSessionId(session.getId());
            dto.setExercises(exercises.stream().map(WorkoutMapper::toResponseDto).collect(Collectors.toList()));
            return dto;
        }).collect(Collectors.toList());
    }
}
