package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.MealLogRequestDto;
import com.fitnessai.backend.dtos.response.MealLogResponseDto;
import com.fitnessai.backend.services.MealLogService;
import com.fitnessai.backend.services.AiVisionService;
import com.fitnessai.backend.services.CloudinaryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/v1/meals")
public class MealLogController {
    private final MealLogService mealLogService;
    private final AiVisionService aiVisionService;
    private final CloudinaryService cloudinaryService;

    public MealLogController(MealLogService mealLogService, AiVisionService aiVisionService, CloudinaryService cloudinaryService) { 
        this.mealLogService = mealLogService;
        this.aiVisionService = aiVisionService;
        this.cloudinaryService = cloudinaryService;
    }

    @PostMapping
    public ResponseEntity<MealLogResponseDto> createMealLog(@Valid @RequestBody MealLogRequestDto dto) {
        return ResponseEntity.ok(mealLogService.createMealLog(dto));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MealLogResponseDto>> getMealsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(mealLogService.getMealLogsByUser(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMealLog(@PathVariable Long id) {
        mealLogService.deleteMealLog(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> analyzeAndUploadMeal(@RequestParam("file") MultipartFile file) {
        try {
            // 1. Subir la foto real a Cloudinary para guardarla permanentemente
            String imageUrl = cloudinaryService.uploadImage(file);

            // 2. Convertir la foto a texto (Base64) solo para que Gemini la pueda leer ahorita
            String base64Image = Base64.getEncoder().encodeToString(file.getBytes());

            // 3. Crear el Prompt Maestro
            String prompt = "Actúa como un experto nutricionista. Analiza la imagen y detecta qué alimentos hay. " +
                "Devuelve el resultado ESTRICTAMENTE en formato JSON plano sin bloques de código Markdown. " +
                "La estructura debe ser: " +
                "{\"imageUrl\": \"" + imageUrl + "\", " +
                "\"mealType\": \"LUNCH\", " +
                "\"foodItems\": \"Nombres de los alimentos\", " +
                "\"totalCalories\": numero_entero, " +
                "\"totalProtein\": numero_decimal, " +
                "\"totalCarbs\": numero_decimal, " +
                "\"totalFats\": numero_decimal}";

            // 4. Pedirle a Gemini que haga su magia
            String aiJsonResponse = aiVisionService.analyzeImage(base64Image, prompt);

            int start = aiJsonResponse.indexOf('{');
            int end = aiJsonResponse.lastIndexOf('}');
            if (start != -1 && end != -1 && start < end) {
                aiJsonResponse = aiJsonResponse.substring(start, end + 1);
            }

            // 5. Devolvemos el JSON de Gemini (que ya incluye el link de Cloudinary incrustado) al celular
            return ResponseEntity.ok(aiJsonResponse);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Error al procesar la imagen: " + e.getMessage() + "\"}");
        }
    }
}
