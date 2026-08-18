package com.fitnessai.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.List;
import java.util.Map;

@Service
public class GeminiVisionServiceImpl implements AiVisionService {

    private final RestClient restClient;
    private final String apiKey;
    private final String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

    public GeminiVisionServiceImpl(@Value("${gemini.api.key:AQUI_IRA_TU_API_KEY}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.builder().build();
    }

    @Override
    public String analyzeImage(String base64Image, String prompt) {
        // 1. Armamos el "cuerpo" dependiendo de si hay imagen o es solo texto
        List<Map<String, Object>> parts;
        if (base64Image == null || base64Image.isEmpty()) {
            parts = List.of(Map.of("text", prompt));
        } else {
            parts = List.of(
                Map.of("text", prompt),
                Map.of("inlineData", Map.of(
                    "mimeType", "image/jpeg",
                    "data", base64Image
                ))
            );
        }

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", parts)
            ),
            "generationConfig", Map.of(
                "responseMimeType", "application/json",
                "maxOutputTokens", 2048
            )
        );

        // 2. Disparamos la petición a la IA
        try {
            Map response = restClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(Map.class);

            // 3. Extraemos el texto JSON de la respuesta compleja de Gemini
            return extractTextFromResponse(response);
            
        } catch (Exception e) {
            throw new RuntimeException("Error al comunicarse con la IA: " + e.getMessage());
        }
    }

    private String extractTextFromResponse(Map response) {
        try {
            List candidates = (List) response.get("candidates");
            Map firstCandidate = (Map) candidates.get(0);
            Map content = (Map) firstCandidate.get("content");
            List parts = (List) content.get("parts");
            Map firstPart = (Map) parts.get(0);
            return (String) firstPart.get("text");
        } catch (Exception e) {
            throw new RuntimeException("La IA no devolvió el formato esperado.");
        }
    }
}
