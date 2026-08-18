package com.fitnessai.backend.config;

import com.fitnessai.backend.entities.User;
import com.fitnessai.backend.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        createOrUpdateAdmin("admin@fittrack.com", "06011998");
        createOrUpdateAdmin("admin", "06011998");
    }

    private void createOrUpdateAdmin(String emailOrUser, String rawPassword) {
        User admin = userRepository.findByEmail(emailOrUser).orElse(null);

        if (admin == null) {
            admin = User.builder()
                    .email(emailOrUser)
                    .fullName("Super Administrador")
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .role(User.Role.ROLE_ADMIN)
                    .goal(User.Goal.MAINTAIN)
                    .currentWeight(75.0)
                    .height(175.0)
                    .age(28)
                    .gender("MALE")
                    .activityLevel(1.55)
                    .baseCalories(2000)
                    .dailyCaloriesTarget(2200)
                    .dailyProteinTarget(160)
                    .dailyCarbsTarget(220)
                    .dailyFatsTarget(70)
                    .xp(999)
                    .level(10)
                    .build();
            userRepository.save(admin);
            System.out.println("✅ [SECURITY] Usuario Administrador (" + emailOrUser + ") creado con éxito con clave encriptada BCrypt.");
        } else {
            // Asegurar que tenga el rol ROLE_ADMIN y contraseña actualizada
            boolean updated = false;
            if (admin.getRole() != User.Role.ROLE_ADMIN) {
                admin.setRole(User.Role.ROLE_ADMIN);
                updated = true;
            }
            if (!passwordEncoder.matches(rawPassword, admin.getPasswordHash())) {
                admin.setPasswordHash(passwordEncoder.encode(rawPassword));
                updated = true;
            }
            if (updated) {
                userRepository.save(admin);
                System.out.println("✅ [SECURITY] Usuario (" + emailOrUser + ") actualizado con rol ROLE_ADMIN.");
            }
        }
    }
}
