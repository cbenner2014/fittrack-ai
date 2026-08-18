package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.response.UserResponseDto;
import com.fitnessai.backend.entities.User;
import com.fitnessai.backend.mappers.UserMapper;
import com.fitnessai.backend.repositories.MachineLogRepository;
import com.fitnessai.backend.repositories.MealLogRepository;
import com.fitnessai.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final MealLogRepository mealLogRepository;
    private final MachineLogRepository machineLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AdminController(
            UserRepository userRepository,
            MealLogRepository mealLogRepository,
            MachineLogRepository machineLogRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.mealLogRepository = mealLogRepository;
        this.machineLogRepository = machineLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        long totalUsers = userRepository.count();
        long totalMeals = mealLogRepository.count();
        long totalMachines = machineLogRepository.count();
        
        List<User> allUsers = userRepository.findAll();
        long adminCount = allUsers.stream().filter(u -> u.getRole() == User.Role.ROLE_ADMIN).count();
        
        // Distribución de objetivos
        long loseWeightCount = allUsers.stream().filter(u -> u.getGoal() == User.Goal.LOSE_WEIGHT).count();
        long gainMuscleCount = allUsers.stream().filter(u -> u.getGoal() == User.Goal.GAIN_MUSCLE).count();
        long maintainCount = allUsers.stream().filter(u -> u.getGoal() == User.Goal.MAINTAIN).count();

        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                        "totalUsers", totalUsers,
                        "totalMealsLogged", totalMeals,
                        "totalMachinesLogged", totalMachines,
                        "adminUsersCount", adminCount,
                        "goalsDistribution", Map.of(
                                "loseWeight", loseWeightCount,
                                "gainMuscle", gainMuscleCount,
                                "maintain", maintainCount
                        )
                )
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsersForAdmin() {
        List<UserResponseDto> users = userRepository.findAll().stream()
                .map(UserMapper::toResponseDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of(
                "success", true,
                "total", users.size(),
                "data", users
        ));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String roleStr = body.get("role");
        if (roleStr == null || (!roleStr.equals("ROLE_ADMIN") && !roleStr.equals("ROLE_USER"))) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Rol inválido. Solo se permite ROLE_ADMIN o ROLE_USER."
            ));
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        user.setRole(User.Role.valueOf(roleStr));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Rol actualizado a " + roleStr + " exitosamente",
                "data", UserMapper.toResponseDto(user)
        ));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUserByAdmin(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        userRepository.delete(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Usuario eliminado exitosamente"
        ));
    }

    @PostMapping("/users/{id}/reset-password")
    public ResponseEntity<Map<String, Object>> resetUserPassword(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.trim().length() < 4) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "La nueva contraseña debe tener al menos 4 caracteres."
            ));
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Contraseña restablecida exitosamente para " + user.getEmail()
        ));
    }
}
