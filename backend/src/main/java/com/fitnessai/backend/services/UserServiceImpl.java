package com.fitnessai.backend.services;

import com.fitnessai.backend.dtos.request.UserRequestDto;
import com.fitnessai.backend.dtos.response.UserResponseDto;
import com.fitnessai.backend.entities.User;
import com.fitnessai.backend.mappers.UserMapper;
import com.fitnessai.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Autowired
    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserResponseDto createUser(UserRequestDto userRequestDto) {
        if (userRepository.findByEmail(userRequestDto.getEmail()).isPresent()) {
            throw new RuntimeException("El email ya está registrado");
        }

        User user = UserMapper.toEntity(userRequestDto);
        User savedUser = userRepository.save(user);
        return UserMapper.toResponseDto(savedUser);
    }

    @Override
    public UserResponseDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        return UserMapper.toResponseDto(user);
    }

    @Override
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public UserResponseDto updateUser(Long id, UserRequestDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        if (dto.getFullName() != null) user.setFullName(dto.getFullName());
        if (dto.getCurrentWeight() != null) user.setCurrentWeight(dto.getCurrentWeight());
        if (dto.getHeight() != null) user.setHeight(dto.getHeight());
        if (dto.getAge() != null) user.setAge(dto.getAge());
        if (dto.getGender() != null) user.setGender(dto.getGender());
        if (dto.getActivityLevel() != null) user.setActivityLevel(dto.getActivityLevel());
        if (dto.getBaseCalories() != null) user.setBaseCalories(dto.getBaseCalories());
        if (dto.getDailyCaloriesTarget() != null) user.setDailyCaloriesTarget(dto.getDailyCaloriesTarget());
        if (dto.getDailyProteinTarget() != null) user.setDailyProteinTarget(dto.getDailyProteinTarget());
        if (dto.getDailyCarbsTarget() != null) user.setDailyCarbsTarget(dto.getDailyCarbsTarget());
        if (dto.getDailyFatsTarget() != null) user.setDailyFatsTarget(dto.getDailyFatsTarget());
        
        // Anti-Cheat: NO se permite modificar directamente el nivel o XP desde la edición de perfil.

        if (dto.getGoal() != null) {
            user.setGoal(User.Goal.valueOf(dto.getGoal().toUpperCase()));
        }

        User updatedUser = userRepository.save(user);
        return UserMapper.toResponseDto(updatedUser);
    }

    @Override
    public UserResponseDto addXp(Long id, int amount) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        int currentXp = (user.getXp() != null ? user.getXp() : 0) + amount;
        int currentLevel = user.getLevel() != null ? user.getLevel() : 1;
        int xpNeeded = currentLevel * 300;

        while (currentXp >= xpNeeded) {
            currentLevel++;
            currentXp -= xpNeeded;
            xpNeeded = currentLevel * 300;
        }

        user.setXp(currentXp);
        user.setLevel(currentLevel);

        User updatedUser = userRepository.save(user);
        return UserMapper.toResponseDto(updatedUser);
    }
}
