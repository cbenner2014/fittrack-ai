package com.fitnessai.backend.mappers;

import com.fitnessai.backend.dtos.request.UserRequestDto;
import com.fitnessai.backend.dtos.response.UserResponseDto;
import com.fitnessai.backend.entities.User;

public class UserMapper {

    public static User toEntity(UserRequestDto dto) {
        if (dto == null) return null;
        
        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPasswordHash(dto.getPassword()); // En un futuro aquí usaremos BCrypt
        user.setFullName(dto.getFullName());
        user.setInitialWeight(dto.getInitialWeight());
        user.setCurrentWeight(dto.getCurrentWeight());
        user.setHeight(dto.getHeight());
        
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
        dto.setCurrentWeight(user.getCurrentWeight());
        dto.setHeight(user.getHeight());
        
        if (user.getGoal() != null) {
            dto.setGoal(user.getGoal().name());
        }
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
