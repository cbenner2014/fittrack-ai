package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.ImageAnalysisRequestDto;
import com.fitnessai.backend.services.AiVisionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fitnessai.backend.services.CloudinaryService;
import org.springframework.http.MediaType;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
public class AiAnalysisController {

    private final AiVisionService aiVisionService;
    private final CloudinaryService cloudinaryService;

    public AiAnalysisController(AiVisionService aiVisionService, CloudinaryService cloudinaryService) {
        this.aiVisionService = aiVisionService;
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping("/analyze-meal")
    public ResponseEntity<String> analyzeMeal(@Valid @RequestBody ImageAnalysisRequestDto requestDto) {
        // Prompt maestro para obligar a la IA a dar la estructura exacta
        String prompt = "Actúa como un experto nutricionista. Analiza la imagen proporcionada y detecta qué alimentos hay. " +
                "Devuelve el resultado ESTRICTAMENTE en formato JSON plano sin bloques de código Markdown (```json). " +
                "La estructura exacta debe ser: " +
                "{\"detectedFoods\": \"Nombres de los alimentos detectados en texto plano separado por comas\", " +
                "\"totalCalories\": numero_entero, " +
                "\"totalProtein\": numero_decimal, " +
                "\"totalCarbs\": numero_decimal, " +
                "\"totalFats\": numero_decimal}";

        // Llamamos a nuestro servicio que se conecta con Gemini
        String aiJsonResponse = aiVisionService.analyzeImage(requestDto.getBase64Image(), prompt);

        // Devolvemos la respuesta directamente al frontend (ya viene en formato JSON)
        return ResponseEntity.ok(aiJsonResponse);
    }

    @PostMapping("/analyze-body")
    public ResponseEntity<String> analyzeBody(@Valid @RequestBody ImageAnalysisRequestDto requestDto) {
        String prompt = "Actúa como un entrenador personal experto en recomposición corporal. Analiza la imagen proporcionada de un físico y detecta cambios o da una estimación aproximada. " +
                "Devuelve el resultado ESTRICTAMENTE en formato JSON plano sin bloques de código Markdown (```json). " +
                "La estructura exacta debe ser: " +
                "{\"estimatedBodyFat\": \"Porcentaje estimado (ej. 15-18%)\", " +
                "\"muscleMass\": \"Breve análisis de la masa muscular visible\", " +
                "\"feedback\": \"Feedback constructivo y motivacional sobre el progreso físico.\"}";

        String aiJsonResponse = aiVisionService.analyzeImage(requestDto.getBase64Image(), prompt);
        return ResponseEntity.ok(aiJsonResponse);
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadImageTest(@RequestParam("file") MultipartFile file) {
        // Subimos el archivo a Cloudinary
        String imageUrl = cloudinaryService.uploadImage(file);
        
        // Devolvemos la URL generada
        return ResponseEntity.ok(Map.of(
            "message", "Imagen subida exitosamente",
            "url", imageUrl
        ));
    }
}
