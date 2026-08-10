package com.fitnessai.backend.mappers;

import com.fitnessai.backend.dtos.request.ExerciseRequestDto;
import com.fitnessai.backend.dtos.request.WorkoutRequestDto;
import com.fitnessai.backend.dtos.response.ExerciseResponseDto;
import com.fitnessai.backend.dtos.response.WorkoutResponseDto;
import com.fitnessai.backend.entities.ExerciseLog;
import com.fitnessai.backend.entities.WorkoutSession;

import java.util.ArrayList;
import java.util.stream.Collectors;

public class WorkoutMapper {

    public static WorkoutSession toEntity(WorkoutRequestDto dto) {
        if (dto == null) return null;
        WorkoutSession session = new WorkoutSession();
        session.setSessionDate(dto.getSessionDate());
        session.setNotes(dto.getNotes());
        return session;
    }

    public static ExerciseLog toEntity(ExerciseRequestDto dto) {
        if (dto == null) return null;
        ExerciseLog log = new ExerciseLog();
        log.setWeightLifted(dto.getWeightLifted());
        log.setRepetitions(dto.getRepetitions());
        if (dto.getSets() != null) log.setSets(dto.getSets());
        log.setImageUrl(dto.getImageUrl());
        return log;
    }

    public static WorkoutResponseDto toResponseDto(WorkoutSession session) {
        if (session == null) return null;
        WorkoutResponseDto dto = new WorkoutResponseDto();
        dto.setId(session.getId());
        if (session.getUser() != null) dto.setUserId(session.getUser().getId());
        if (session.getGym() != null) {
            dto.setGymId(session.getGym().getId());
            dto.setGymName(session.getGym().getName());
        }
        dto.setSessionDate(session.getSessionDate());
        dto.setNotes(session.getNotes());
        dto.setCreatedAt(session.getCreatedAt());
        return dto;
    }

    public static ExerciseResponseDto toResponseDto(ExerciseLog log) {
        if (log == null) return null;
        ExerciseResponseDto dto = new ExerciseResponseDto();
        dto.setId(log.getId());
        if (log.getMachine() != null) {
            dto.setMachineId(log.getMachine().getId());
            dto.setMachineName(log.getMachine().getName());
        }
        dto.setWeightLifted(log.getWeightLifted());
        dto.setRepetitions(log.getRepetitions());
        dto.setSets(log.getSets());
        dto.setImageUrl(log.getImageUrl());
        dto.setAiConfidenceScore(log.getAiConfidenceScore());
        return dto;
    }
}
