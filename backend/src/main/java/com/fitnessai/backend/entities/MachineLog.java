package com.fitnessai.backend.entities;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "machine_logs")
@Data
public class MachineLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private String machineName;
    private String targetMuscle;

    @Column(length = 2000)
    private String instructions;

    @Column(length = 1000)
    private String tips;

    private String imageUrl;

    @Column(length = 500)
    private String weightLog;

    @Column(length = 200)
    private String routineDays; // ej: "Lunes,Jueves" o "L,J"

    private String logDate; // yyyy-MM-dd
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
