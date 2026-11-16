package com.campuscare.controller;

import com.campuscare.dto.AdminDtos;
import com.campuscare.service.AiService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Optional AI suggestion endpoint. Never required for complaint submission. */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/suggest")
    public ResponseEntity<AdminDtos.AiSuggestion> suggest(
            @Valid @RequestBody AdminDtos.AiSuggestRequest request) {
        return ResponseEntity.ok(aiService.suggest(request.title(), request.description()));
    }
}
