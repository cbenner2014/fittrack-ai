package com.fitnessai.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GeminiVisionServiceImpl implements AiVisionService {

    private static final Logger log = LoggerFactory.getLogger(GeminiVisionServiceImpl.java);

    private final RestClient restClient;
    private final String apiKey;
    private final String primaryModel;

    public GeminiVisionServiceImpl(
            @Value("${gemini.api.key:AQUI_IRA_TU_API_KEY}") String apiKey,
            @Value("${gemini.api.model:gemini-3.6-flash}") String model
    ) {
        this.apiKey = apiKey;
        this.primaryModel = model;
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

        // 2. Lista de modelos con fallback automático en caso de saturación (503 / 429)
        List<String> candidateModels = new ArrayList<>();
        candidateModels.add(primaryModel);
        if (!candidateModels.contains("gemini-3.5-flash")) candidateModels.add("gemini-3.5-flash");
        if (!candidateModels.contains("gemini-3.5-flash-lite")) candidateModels.add("gemini-3.5-flash-lite");

        Exception lastException = null;

        for (String modelName : candidateModels) {
            String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;
            try {
                Map response = restClient.post()
                        .uri(endpoint)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody)
                        .retrieve()
                        .body(Map.class);

                // 3. Extraemos el texto JSON de la respuesta
                return extractTextFromResponse(response);

            } catch (Exception e) {
                lastException = e;
                log.warn("Modelo {} no disponible o saturado ({}), intentando siguiente modelo...", modelName, e.getMessage());
            }
        }

        throw new RuntimeException("Error al comunicarse con la IA: " + (lastException != null ? lastException.getMessage() : "Desconocido"));
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
