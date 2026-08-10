package com.fitnessai.backend.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "body_progress_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BodyProgressLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "front_image_url", length = 500)
    private String frontImageUrl;

    @Column(name = "side_image_url", length = 500)
    private String sideImageUrl;

    @Column(name = "recorded_weight")
    private Double recordedWeight;

    @Column(name = "ai_estimated_body_fat")
    private Double aiEstimatedBodyFat;

    @Column(name = "ai_feedback_notes", columnDefinition = "TEXT")
    private String aiFeedbackNotes;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
