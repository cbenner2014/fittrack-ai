package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.UserRequestDto;
import com.fitnessai.backend.dtos.request.LoginRequestDto;
import com.fitnessai.backend.dtos.response.UserResponseDto;
import com.fitnessai.backend.services.UserService;
import com.fitnessai.backend.repositories.UserRepository;
import com.fitnessai.backend.entities.User;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.fitnessai.backend.services.CloudinaryService;
import com.fitnessai.backend.utils.JwtUtil;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final CloudinaryService cloudinaryService;

    @Autowired
    public UserController(
            UserService userService, 
            UserRepository userRepository, 
            JwtUtil jwtUtil,
            PasswordEncoder passwordEncoder,
            CloudinaryService cloudinaryService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequestDto loginDto) {
        User user = userRepository.findByEmail(loginDto.getEmail())
                .orElse(null);
                
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Credenciales incorrectas"
            ));
        }

        // Verificación segura con BCrypt
        boolean passwordValid = passwordEncoder.matches(loginDto.getPassword(), user.getPasswordHash());

        // Compatibilidad retroactiva: si el usuario fue creado previamente en texto plano, migramos su hash automáticamente
        if (!passwordValid && user.getPasswordHash().equals(loginDto.getPassword())) {
            passwordValid = true;
            user.setPasswordHash(passwordEncoder.encode(loginDto.getPassword()));
            userRepository.save(user);
        }

        if (!passwordValid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                    "success", false,
                    "message", "Credenciales incorrectas"
            ));
        }
        
        String userRole = user.getRole() != null ? user.getRole().name() : "ROLE_USER";
        String token = jwtUtil.generateToken(user.getId(), userRole);
        
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Login exitoso",
                "userId", user.getId(),
                "fullName", user.getFullName(),
                "role", userRole,
                "token", token
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> createUser(@Valid @RequestBody UserRequestDto userRequestDto) {
        UserResponseDto createdUser = userService.createUser(userRequestDto);
        String role = createdUser.getRole() != null ? createdUser.getRole() : "ROLE_USER";
        String token = jwtUtil.generateToken(createdUser.getId(), role);
        
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "success", true,
                "message", "Usuario creado exitosamente",
                "data", createdUser,
                "role", role,
                "token", token
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getUserById(@PathVariable Long id) {
        UserResponseDto user = userService.getUserById(id);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", user
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody UserRequestDto userRequestDto) {
        UserResponseDto updatedUser = userService.updateUser(id, userRequestDto);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Perfil actualizado correctamente",
                "data", updatedUser
        ));
    }

    @PostMapping("/{id}/add-xp")
    public ResponseEntity<Map<String, Object>> addXp(
            @PathVariable Long id, 
            @RequestParam(defaultValue = "50") Integer amount) {
        if (amount == null || amount <= 0 || amount > 200) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Cantidad de XP inválida (máx 200 por acción)"
            ));
        }
        UserResponseDto updatedUser = userService.addXp(id, amount);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "XP sumada correctamente",
                "data", updatedUser
        ));
    }

    @PostMapping(value = "/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadAvatar(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        String imageUrl = cloudinaryService.uploadImage(file);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado con ID: " + id));
        user.setAvatarUrl(imageUrl);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Foto de perfil actualizada correctamente",
                "avatarUrl", imageUrl
        ));
    }
}
