package com.campuscare.controller;

import com.campuscare.dto.AdminDtos;
import com.campuscare.dto.AuthDtos;
import com.campuscare.dto.TicketDtos;
import com.campuscare.model.Role;
import com.campuscare.security.UserPrincipal;
import com.campuscare.service.CategoryService;
import com.campuscare.service.MainAdminService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** Endpoints protected by hasRole("MAIN_ADMIN") in SecurityConfig. */
@RestController
@RequestMapping("/api/main-admin")
public class MainAdminController {

    private final MainAdminService mainAdminService;
    private final CategoryService categoryService;

    public MainAdminController(MainAdminService mainAdminService, CategoryService categoryService) {
        this.mainAdminService = mainAdminService;
        this.categoryService = categoryService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDtos.AdminDashboardStats> dashboard() {
        return ResponseEntity.ok(mainAdminService.dashboard());
    }

    @GetMapping("/users")
    public ResponseEntity<List<AuthDtos.UserSummary>> users(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) String search) {
        return ResponseEntity.ok(mainAdminService.listUsers(role, search));
    }

    @PostMapping("/admins")
    public ResponseEntity<AuthDtos.UserSummary> createAdmin(
            @Valid @RequestBody AdminDtos.AdminCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(mainAdminService.createAdmin(request));
    }

    @PutMapping("/users/{id}/status")
    public ResponseEntity<AuthDtos.UserSummary> userStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminDtos.UserStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(
                mainAdminService.updateUserStatus(id, request.active(), principal.getId()));
    }

    @GetMapping("/reports")
    public ResponseEntity<AdminDtos.ReportResponse> reports(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(mainAdminService.generateReport(from, to));
    }

    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] csv = mainAdminService.reportCsv(from, to);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"campuscare-report-" + LocalDate.now() + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<TicketDtos.CategoryDto>> categories() {
        return ResponseEntity.ok(categoryService.listAll());
    }

    @PostMapping("/categories")
    public ResponseEntity<TicketDtos.CategoryDto> createCategory(
            @Valid @RequestBody AdminDtos.CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(categoryService.create(request));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<TicketDtos.CategoryDto> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody AdminDtos.CategoryRequest request) {
        return ResponseEntity.ok(categoryService.update(id, request));
    }
}
