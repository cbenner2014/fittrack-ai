package com.fitnessai.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data // Lombok: genera getters, setters, toString, equals y hashCode
@NoArgsConstructor // Lombok: constructor vacío
@AllArgsConstructor // Lombok: constructor con todos los argumentos
@Builder // Lombok: Patrón builder para instanciar fácilmente
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "initial_weight")
    private Double initialWeight;

    @Column(name = "current_weight")
    private Double currentWeight;

    private Double height;

    private Integer age;
    private String gender;
    private Double activityLevel;

    @Column(name = "base_calories")
    private Integer baseCalories;

    @Column(name = "daily_calories_target")
    private Integer dailyCaloriesTarget;

    @Column(name = "daily_protein_target")
    private Integer dailyProteinTarget;

    @Column(name = "daily_carbs_target")
    private Integer dailyCarbsTarget;

    @Column(name = "daily_fats_target")
    private Integer dailyFatsTarget;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private Integer xp = 0;

    @Column(nullable = false, columnDefinition = "integer default 1")
    private Integer level = 1;

    @Enumerated(EnumType.STRING)
    private Goal goal;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Goal {
        LOSE_WEIGHT, GAIN_MUSCLE, MAINTAIN
    }
}
