package com.campuscare.service;

import com.campuscare.dto.AdminDtos;
import com.campuscare.model.Category;
import com.campuscare.model.Priority;
import com.campuscare.repository.CategoryRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Optional AI-assisted complaint classification.
 * AI output is treated as a suggestion only; it is validated and staff can
 * always override the category and priority manually.
 */
@Service
public class AiService {

    private final GeminiClient geminiClient;
    private final CategoryRepository categoryRepository;

    public AiService(GeminiClient geminiClient, CategoryRepository categoryRepository) {
        this.geminiClient = geminiClient;
        this.categoryRepository = categoryRepository;
    }

    public AdminDtos.AiSuggestion suggest(String title, String description) {
        if (!geminiClient.isConfigured()) {
            return unavailable("AI suggestions are not configured on this server.");
        }

        List<Category> categories = categoryRepository.findByActiveTrueOrderByNameAsc();
        String categoryNames = categories.stream().map(Category::getName).collect(Collectors.joining(", "));

        String prompt = """
                You are helping a university campus help desk classify a student complaint.
                Choose the category only from this list: %s.
                Choose priority only from: LOW, MEDIUM, HIGH, URGENT.
                Return ONLY a JSON object with exactly these keys:
                "category" (string from the list),
                "priority" (one of the allowed values),
                "summary" (one short sentence, maximum 40 words),
                "department" (short suggested department name).
                Do not include markdown or any extra text.

                Complaint title: %s
                Complaint description: %s
                """.formatted(categoryNames, title, description);

        Optional<JsonNode> response = geminiClient.generateJson(prompt);
        if (response.isEmpty()) {
            return unavailable("AI suggestions are temporarily unavailable. You can still submit your complaint.");
        }

        JsonNode node = response.get();
        String suggestedCategory = validateCategory(node.path("category").asText(""), categories);
        String suggestedPriority = validatePriority(node.path("priority").asText(""));
        String summary = limit(node.path("summary").asText(""), 500);
        String department = limit(node.path("department").asText(""), 120);

        if (suggestedCategory == null || suggestedPriority == null) {
            return unavailable("The AI response could not be validated. Please choose the category manually.");
        }

        return new AdminDtos.AiSuggestion(suggestedCategory, suggestedPriority, summary, department,
                true, "AI suggestion only. Please confirm before submitting.");
    }

    private String validateCategory(String value, List<Category> categories) {
        return categories.stream()
                .map(Category::getName)
                .filter(name -> name.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElse(null);
    }

    private String validatePriority(String value) {
        try {
            return Priority.valueOf(value.trim().toUpperCase()).name();
        } catch (RuntimeException ex) {
            return null;
        }
    }

    private String limit(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    private AdminDtos.AiSuggestion unavailable(String note) {
        return new AdminDtos.AiSuggestion(null, null, null, null, false, note);
    }
}
