package com.campuscare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Thin wrapper around the Google Gemini generateContent API.
 * The API key lives only on the backend. Every failure returns Optional.empty()
 * so the normal complaint workflow never depends on AI availability.
 */
@Component
public class GeminiClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);

    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;
    private final boolean enabled;
    private final RestClient restClient;

    public GeminiClient(@Value("${app.gemini.api-key:}") String apiKey,
                        @Value("${app.gemini.model:gemini-2.5-flash}") String model,
                        @Value("${app.gemini.enabled:true}") boolean enabled,
                        ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.model = model;
        this.enabled = enabled;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(4));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .baseUrl("https://generativelanguage.googleapis.com")
                .requestFactory(requestFactory)
                .build();
    }

    public boolean isConfigured() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }

    public Optional<JsonNode> generateJson(String prompt) {
        if (!isConfigured()) {
            return Optional.empty();
        }

        try {
            Map<String, Object> body = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig", Map.of("temperature", 0.2, "responseMimeType", "application/json")
            );

            String raw = restClient.post()
                    .uri("/v1beta/models/{model}:generateContent", model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (raw == null || raw.isBlank()) {
                return Optional.empty();
            }

            JsonNode root = objectMapper.readTree(raw);
            String text = root.path("candidates").path(0).path("content")
                    .path("parts").path(0).path("text").asText(null);
            if (text == null || text.isBlank()) {
                return Optional.empty();
            }

            // Gemini occasionally wraps JSON in markdown fences; remove them.
            String cleaned = text.trim()
                    .replaceFirst("^```(?:json)?", "")
                    .replaceFirst("```$", "")
                    .trim();
            return Optional.of(objectMapper.readTree(cleaned));
        } catch (Exception ex) {
            log.warn("Gemini request failed; continuing without AI suggestion: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}
