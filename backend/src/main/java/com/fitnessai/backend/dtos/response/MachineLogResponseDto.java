package com.fitnessai.backend.dtos.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MachineLogResponseDto {
    private Long id;
    private Long userId;
    private String machineName;
    private String targetMuscle;
    private String instructions;
    private String tips;
    private String imageUrl;
    private String logDate;
    private LocalDateTime createdAt;
}
