package com.fitnessai.backend.services;

public interface AiVisionService {
    /**
     * Analiza una imagen usando un modelo multimodal de IA.
     * @param base64Image La imagen codificada en Base64.
     * @param prompt Las instrucciones detalladas para la IA.
     * @return El JSON devuelto por la IA con la estructura solicitada.
     */
    String analyzeImage(String base64Image, String prompt);
}
