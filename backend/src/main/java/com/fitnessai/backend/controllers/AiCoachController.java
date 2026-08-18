package com.fitnessai.backend.controllers;

import com.fitnessai.backend.dtos.request.AiCoachRecommendationRequestDto;
import com.fitnessai.backend.dtos.response.AiCoachRecommendationResponseDto;
import com.fitnessai.backend.services.AiCoachService;
import com.fitnessai.backend.services.AiVisionService;
import com.fitnessai.backend.repositories.UserRepository;
import com.fitnessai.backend.entities.User;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

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

    @PostMapping(value = "/generate-plan/{userId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> generateWeeklyPlan(
            @PathVariable Long userId,
            @RequestParam(required = false, defaultValue = "Tradicional (3 a 5 comidas)") String dietPreference) {
        try {
            // 1. Buscar los datos reales del usuario de forma segura
            User user = userRepository.findById(userId).orElse(null);

            String fullName = user != null && user.getFullName() != null ? user.getFullName() : "Atleta";
            String weight = user != null && user.getCurrentWeight() != null ? user.getCurrentWeight().toString() : "75.0";
            String height = user != null && user.getHeight() != null ? user.getHeight().toString() : "175.0";
            String goal = user != null && user.getGoal() != null ? user.getGoal().name() : "Mantenimiento";

            // 2. Armar el Prompt Inteligente
            String prompt = "Actúa como un Nutricionista y Entrenador Personal de Élite. " +
                    "Tengo un cliente con el siguiente perfil: " +
                    "Nombre: " + fullName + ", " +
                    "Peso: " + weight + " kg, Altura: " + height + " cm, " +
                    "Objetivo principal: " + goal + ". " +
                    "Preferencia de Alimentación / Dieta elegida por el usuario: " + dietPreference + ". " +
                    "REGLA CRÍTICA: Toma OBLIGATORIAMENTE en cuenta esta preferencia (" + dietPreference + ") al organizar los horarios de sus comidas y el tipo de alimentos. Da una breve precaución o consejo sobre esta dieta. " +
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
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"error\": \"Error al generar el plan: " + e.getMessage() + "\"}");
        }
    }

    @PostMapping(value = "/generate-shopping-list", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> generateShoppingList(@RequestBody Map<String, String> payload) {
        String planStr = payload.get("nutritionPlan");
        String prompt = "Actúa como un experto organizador de compras de supermercado. En base a este plan nutricional semanal exacto: " + planStr + ". " +
                "Genera una lista de compras para sobrevivir toda la semana. Suma las cantidades para que el usuario compre al por mayor (ej. 2kg de Pechuga en vez de 200g repetido). " +
                "Agrupa todo en categorías lógicas. " +
                "Devuelve el resultado ESTRICTAMENTE en formato JSON plano sin Markdown. " +
                "Estructura exacta: " +
                "{\"shoppingList\": [{\"category\": \"Carnes y Proteínas\", \"items\": [\"2kg Pechuga de pollo\", \"1 cartón de huevos\"]}]}";
        
        try {
            String aiJsonResponse = aiVisionService.analyzeImage("", prompt);
            
            int start = aiJsonResponse.indexOf('{');
            int end = aiJsonResponse.lastIndexOf('}');
            if (start != -1 && end != -1 && start < end) {
                aiJsonResponse = aiJsonResponse.substring(start, end + 1);
            }
            
            return ResponseEntity.ok(aiJsonResponse);
        } catch (Exception e) {
            e.printStackTrace();
            // Fallback robusto en caso de que Gemini rechace el prompt o falle
            String fallbackJson = "{\"shoppingList\": [{\"category\": \"Básicos\", \"items\": [\"Pollo, Huevos, Vegetales (Revisa tu plan manualmente)\"]}]}";
            return ResponseEntity.ok(fallbackJson);
        }
    }
}
