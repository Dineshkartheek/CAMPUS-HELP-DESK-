package com.campuscare.controller;

import com.campuscare.dto.TicketDtos;
import com.campuscare.service.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Active categories for complaint submission forms (any logged-in user). */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<TicketDtos.CategoryDto>> list() {
        return ResponseEntity.ok(categoryService.listActive());
    }
}
