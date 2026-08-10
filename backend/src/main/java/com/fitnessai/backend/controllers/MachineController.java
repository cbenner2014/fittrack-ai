package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.MachineRequestDto;
import com.fitnessai.backend.dtos.response.MachineResponseDto;
import com.fitnessai.backend.services.MachineService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import com.fitnessai.backend.services.AiVisionService;
import com.fitnessai.backend.services.CloudinaryService;

import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/v1/machines")
public class MachineController {
    private final MachineService machineService;
    private final AiVisionService aiVisionService;
    private final CloudinaryService cloudinaryService;

    public MachineController(MachineService machineService, AiVisionService aiVisionService, CloudinaryService cloudinaryService) {
        this.machineService = machineService;
        this.aiVisionService = aiVisionService;
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping
    public ResponseEntity<MachineResponseDto> createMachine(@Valid @RequestBody MachineRequestDto dto) {
        return ResponseEntity.ok(machineService.createMachine(dto));
    }

    @GetMapping
    public ResponseEntity<List<MachineResponseDto>> getAllMachines() {
        return ResponseEntity.ok(machineService.getAllMachines());
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> analyzeGymMachine(@RequestParam("file") MultipartFile file) {
        try {
            // 1. Subir la foto real a Cloudinary
            String imageUrl = cloudinaryService.uploadImage(file);

            // 2. Convertir a Base64 para Gemini
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());

            // 3. Crear el Prompt Maestro para Máquinas de Gimnasio
            String prompt = "Actúa como un Entrenador Personal experto. Analiza la imagen de esta máquina de gimnasio. " +
                "Devuelve el resultado ESTRICTAMENTE en formato JSON plano sin bloques de código Markdown. " +
                "La estructura debe ser: " +
                "{\"imageUrl\": \"" + imageUrl + "\", " +
                "\"name\": \"Nombre común de la máquina\", " +
                "\"targetMuscles\": \"Músculos principales y secundarios que trabaja\", " +
                "\"usageInstructions\": \"Instrucciones paso a paso. Usa etiquetas HTML <br><br> para separar cada paso y <b> para destacar números o palabras clave\", " +
                "\"safetyTips\": \"1 consejo clave de seguridad o postura\"}";

            // 4. Analizar con Gemini
            String aiJsonResponse = aiVisionService.analyzeImage(base64Image, prompt);

            // 5. Devolver al celular
            return ResponseEntity.ok(aiJsonResponse);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Error al procesar la máquina: " + e.getMessage() + "\"}");
        }
    }
}
