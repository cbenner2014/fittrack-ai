package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.AiCoachRecommendationRequestDto;
import com.fitnessai.backend.dtos.response.AiCoachRecommendationResponseDto;
import com.fitnessai.backend.services.AiCoachService;
import com.fitnessai.backend.services.AiVisionService;
import com.fitnessai.backend.repositories.UserRepository;
import com.fitnessai.backend.entities.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/coach-recommendations")
public class AiCoachController {
    private final AiCoachService service;
    private final UserRepository userRepository;
    private final AiVisionService aiVisionService;

    public AiCoachController(AiCoachService service, UserRepository userRepository, AiVisionService aiVisionService) { 
        this.service = service; 
        this.userRepository = userRepository;
        this.aiVisionService = aiVisionService;
    }
    @PostMapping
    public ResponseEntity<AiCoachRecommendationResponseDto> createRecommendation(@Valid @RequestBody AiCoachRecommendationRequestDto dto) {
        return ResponseEntity.ok(service.createRecommendation(dto));
    }
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AiCoachRecommendationResponseDto>> getRecommendationsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.getRecommendationsByUser(userId));
    }

    @PostMapping("/generate-plan/{userId}")
    public ResponseEntity<String> generateWeeklyPlan(@PathVariable Long userId) {
        try {
            // 1. Buscar los datos reales del usuario
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            String weight = user.getCurrentWeight() != null ? user.getCurrentWeight().toString() : "75.0";
            String height = user.getHeight() != null ? user.getHeight().toString() : "175.0";
            String goal = user.getGoal() != null ? user.getGoal().name() : "Mantenimiento";

            // 2. Armar el Prompt Inteligente
            String prompt = "Actúa como un Nutricionista y Entrenador Personal de Élite. " +
                    "Tengo un cliente con el siguiente perfil: " +
                    "Nombre: " + user.getFullName() + ", " +
                    "Peso: " + weight + " kg, Altura: " + height + " cm, " +
                    "Objetivo principal: " + goal + ". " +
                    "Génerale un plan de alimentación y entrenamiento inicial. " +
                    "Devuelve el resultado ESTRICTAMENTE en formato JSON plano sin Markdown. " +
                    "La estructura exacta debe ser: " +
                    "{\"recommendationType\": \"WEEKLY_PLAN\", " +
                    "\"message\": \"Mensaje motivacional corto\", " +
                    "\"nutritionPlan\": \"Usa etiquetas HTML <br><br> para separar comidas y <b> para negritas en los títulos.\", " +
                    "\"workoutPlan\": \"Usa etiquetas HTML <br><br> para separar cada día y <b> para destacar el nombre del día.\"}";

            // 3. Enviarle el texto a Gemini (sin imagen, por eso Base64 está vacío)
            String aiJsonResponse = aiVisionService.analyzeImage("", prompt);

            // Limpiar cualquier basura extra o texto antes/después del JSON real
            int start = aiJsonResponse.indexOf('{');
            int end = aiJsonResponse.lastIndexOf('}');
            if (start != -1 && end != -1 && start < end) {
                aiJsonResponse = aiJsonResponse.substring(start, end + 1);
            }

            return ResponseEntity.ok(aiJsonResponse);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("{\"error\": \"Error al generar el plan: " + e.getMessage() + "\"}");
        }
    }
}
