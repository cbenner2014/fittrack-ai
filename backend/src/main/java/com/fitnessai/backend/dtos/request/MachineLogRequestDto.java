package com.fitnessai.backend.dtos.request;

import lombok.Data;

@Data
public class MachineLogRequestDto {
    private Long userId;
    private String machineName;
    private String targetMuscle;
    private String instructions;
    private String tips;
    private String imageUrl;
    private String weightLog;
    private String routineDays;
    private String logDate;
}
