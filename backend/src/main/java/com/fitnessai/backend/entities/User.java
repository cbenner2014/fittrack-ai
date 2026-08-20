package com.fitnessai.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(20) default 'ROLE_USER'")
    @Builder.Default
    private Role role = Role.ROLE_USER;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

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
    @Builder.Default
    private Integer xp = 0;

    @Column(nullable = false, columnDefinition = "integer default 1")
    @Builder.Default
    private Integer level = 1;

    @Enumerated(EnumType.STRING)
    private Goal goal;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Role {
        ROLE_USER, ROLE_ADMIN
    }

    public enum Goal {
        LOSE_WEIGHT, GAIN_MUSCLE, MAINTAIN
    }
}
