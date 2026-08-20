package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.BodyProgressLogRequestDto;
import com.fitnessai.backend.dtos.response.BodyProgressLogResponseDto;
import com.fitnessai.backend.services.BodyProgressService;
import com.fitnessai.backend.services.CloudinaryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/body-progress")
public class BodyProgressController {

    private final BodyProgressService service;
    private final CloudinaryService cloudinaryService;

    public BodyProgressController(BodyProgressService service, CloudinaryService cloudinaryService) { 
        this.service = service; 
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping
    public ResponseEntity<BodyProgressLogResponseDto> createProgress(
            HttpServletRequest request,
            @Valid @RequestBody BodyProgressLogRequestDto dto) {
        Long authUserId = (Long) request.getAttribute("userId");
        if (authUserId == null) authUserId = dto.getUserId();
        return ResponseEntity.ok(service.createBodyProgress(authUserId, dto));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BodyProgressLogResponseDto> uploadProgressWithPhoto(
            HttpServletRequest request,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "weight", required = false) Double weight,
            @RequestParam(value = "bodyFat", required = false) Double bodyFat,
            @RequestParam(value = "notes", required = false) String notes,
            @RequestParam(value = "date", required = false) String dateStr) {
        
        Long authUserId = (Long) request.getAttribute("userId");
        if (authUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String imageUrl = cloudinaryService.uploadImage(file);

        BodyProgressLogRequestDto dto = new BodyProgressLogRequestDto();
        dto.setUserId(authUserId);
        dto.setFrontImageUrl(imageUrl);
        dto.setRecordedWeight(weight);
        dto.setAiEstimatedBodyFat(bodyFat);
        dto.setAiFeedbackNotes(notes);
        dto.setLogDate(dateStr != null && !dateStr.isEmpty() ? LocalDate.parse(dateStr) : LocalDate.now());

        return ResponseEntity.ok(service.createBodyProgress(authUserId, dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BodyProgressLogResponseDto>> getProgressByUser(
            HttpServletRequest request,
            @PathVariable Long userId) {
        Long authUserId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");

        // Seguridad: Solo el dueño o un ADMIN puede consultar sus fotos privadas
        if (authUserId != null && !authUserId.equals(userId) && !"ROLE_ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(service.getProgressByUser(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteProgress(
            HttpServletRequest request,
            @PathVariable Long id) {
        Long authUserId = (Long) request.getAttribute("userId");
        String role = (String) request.getAttribute("userRole");

        if (authUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        service.deleteBodyProgress(id, authUserId, role);
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Foto de progreso eliminada correctamente"
        ));
    }
}
