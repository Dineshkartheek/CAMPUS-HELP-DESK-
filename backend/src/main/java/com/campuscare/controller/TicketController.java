package com.campuscare.controller;

import com.campuscare.dto.TicketDtos;
import com.campuscare.model.Priority;
import com.campuscare.model.TicketStatus;
import com.campuscare.security.UserPrincipal;
import com.campuscare.service.TicketService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    @PostMapping
    public ResponseEntity<TicketDtos.TicketResponse> create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TicketDtos.TicketCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.create(principal.getId(), request));
    }

    @GetMapping("/my-tickets")
    public ResponseEntity<TicketDtos.PagedResponse<TicketDtos.TicketResponse>> myTickets(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ticketService.myTickets(
                principal.getId(), status, categoryId, priority, search, page, size));
    }

    @GetMapping("/stats")
    public ResponseEntity<TicketDtos.StudentStats> stats(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ticketService.myStats(principal.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TicketDtos.TicketResponse> get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketForUser(id, principal));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<TicketDtos.HistoryResponse>> history(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getHistory(id, principal));
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<TicketDtos.CommentResponse>> comments(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getComments(id, principal));
    }
}
