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
