package com.fitnessai.backend.mappers;

import com.fitnessai.backend.dtos.request.UserRequestDto;
import com.fitnessai.backend.dtos.response.UserResponseDto;
import com.fitnessai.backend.entities.User;

public class UserMapper {

    public static User toEntity(UserRequestDto dto) {
        if (dto == null) return null;
        
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPasswordHash(dto.getPassword());
        user.setFullName(dto.getFullName());
        user.setRole(User.Role.ROLE_USER); // Por defecto usuario estándar
        user.setInitialWeight(dto.getInitialWeight());
        user.setCurrentWeight(dto.getCurrentWeight());
        user.setHeight(dto.getHeight());
        user.setAge(dto.getAge());
        user.setGender(dto.getGender());
        user.setActivityLevel(dto.getActivityLevel());
        user.setBaseCalories(dto.getBaseCalories());
        user.setDailyCaloriesTarget(dto.getDailyCaloriesTarget());
        user.setDailyProteinTarget(dto.getDailyProteinTarget());
        user.setDailyCarbsTarget(dto.getDailyCarbsTarget());
        user.setDailyFatsTarget(dto.getDailyFatsTarget());
        
        if (dto.getXp() != null) user.setXp(dto.getXp());
        if (dto.getLevel() != null) user.setLevel(dto.getLevel());
        
        if (dto.getGoal() != null) {
            user.setGoal(User.Goal.valueOf(dto.getGoal().toUpperCase()));
        }
        return user;
    }

    public static UserResponseDto toResponseDto(User user) {
        if (user == null) return null;
        
        UserResponseDto dto = new UserResponseDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole() != null ? user.getRole().name() : "ROLE_USER");
        dto.setCurrentWeight(user.getCurrentWeight());
        dto.setHeight(user.getHeight());
        dto.setAge(user.getAge());
        dto.setGender(user.getGender());
        dto.setActivityLevel(user.getActivityLevel());
        dto.setBaseCalories(user.getBaseCalories());
        dto.setDailyCaloriesTarget(user.getDailyCaloriesTarget());
        dto.setDailyProteinTarget(user.getDailyProteinTarget());
        dto.setDailyCarbsTarget(user.getDailyCarbsTarget());
        dto.setDailyFatsTarget(user.getDailyFatsTarget());
        dto.setXp(user.getXp());
        dto.setLevel(user.getLevel());
        
        if (user.getGoal() != null) {
            dto.setGoal(user.getGoal().name());
        }
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
