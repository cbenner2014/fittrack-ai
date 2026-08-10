package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.UserRequestDto;
import com.fitnessai.backend.dtos.response.UserResponseDto;

import java.util.List;

public interface UserService {
    UserResponseDto createUser(UserRequestDto userRequestDto);
    UserResponseDto getUserById(Long id);
    List<UserResponseDto> getAllUsers();
}
