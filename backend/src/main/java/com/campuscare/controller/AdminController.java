package com.campuscare.controller;

import com.campuscare.dto.AdminDtos;
import com.campuscare.dto.AuthDtos;
import com.campuscare.dto.TicketDtos;
import com.campuscare.model.Priority;
import com.campuscare.model.TicketStatus;
import com.campuscare.security.UserPrincipal;
import com.campuscare.service.AdminService;
import com.campuscare.service.CategoryService;
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

/** Endpoints available to ADMIN and MAIN_ADMIN. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final CategoryService categoryService;

    public AdminController(AdminService adminService, CategoryService categoryService) {
        this.adminService = adminService;
        this.categoryService = categoryService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDtos.AdminDashboardStats> dashboard() {
        return ResponseEntity.ok(adminService.dashboard());
    }

    @GetMapping("/tickets")
    public ResponseEntity<TicketDtos.PagedResponse<TicketDtos.TicketResponse>> tickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Long assignedAdminId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(adminService.listTickets(
                status, categoryId, priority, assignedAdminId, from, to, search, page, size));
    }

    @GetMapping("/tickets/{id}")
    public ResponseEntity<TicketDtos.TicketResponse> ticket(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getTicket(id));
    }

    @PutMapping("/tickets/{id}/status")
    public ResponseEntity<TicketDtos.TicketResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody TicketDtos.StatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(adminService.updateStatus(id, request, principal));
    }

    @PutMapping("/tickets/{id}/assign")
    public ResponseEntity<TicketDtos.TicketResponse> assign(
            @PathVariable Long id,
            @Valid @RequestBody TicketDtos.AssignRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(adminService.assign(id, request, principal));
    }

    @PostMapping("/tickets/{id}/comments")
    public ResponseEntity<TicketDtos.CommentResponse> addComment(
            @PathVariable Long id,
            @Valid @RequestBody TicketDtos.CommentRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminService.addComment(id, request, principal));
    }

    @GetMapping("/tickets/export")
    public ResponseEntity<byte[]> exportTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Long assignedAdminId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String search) {

        byte[] csv = adminService.exportTicketsCsv(
                status, categoryId, priority, assignedAdminId, from, to, search);

        return csvResponse(csv, "campuscare-tickets-" + LocalDate.now() + ".csv");
    }

    @GetMapping("/admins")
    public ResponseEntity<List<AuthDtos.UserSummary>> admins() {
        return ResponseEntity.ok(adminService.listActiveAdmins());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<TicketDtos.CategoryDto>> categories() {
        return ResponseEntity.ok(categoryService.listAll());
    }

    private ResponseEntity<byte[]> csvResponse(byte[] csv, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
