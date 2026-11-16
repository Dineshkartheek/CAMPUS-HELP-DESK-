package com.campuscare.dto;

import com.campuscare.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** Request and response objects used by admin and main-admin endpoints. */
public final class AdminDtos {

    private AdminDtos() {
    }

    public record AdminCreateRequest(
            @NotBlank(message = "Full name is required")
            @Size(max = 120)
            String fullName,

            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            @Size(max = 180)
            String email,

            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
            String password,

            @NotNull(message = "Role is required")
            Role role,

            @Size(max = 120)
            String department
    ) {
    }

    public record UserStatusRequest(
            @NotNull(message = "Active status is required")
            Boolean active
    ) {
    }

    public record CategoryRequest(
            @NotBlank(message = "Category name is required")
            @Size(max = 80)
            String name,

            @Size(max = 255)
            String description,

            Boolean active
    ) {
    }

    public record AdminDashboardStats(
            long total,
            long submitted,
            long assigned,
            long inProgress,
            long resolved,
            long closed,
            long rejected,
            long unassigned,
            long urgent,
            Long totalStudents,
            Long totalAdmins,
            Long totalCategories
    ) {
    }

    public record ReportResponse(
            Instant generatedAt,
            LocalDate from,
            LocalDate to,
            long totalTickets,
            Map<String, Long> byStatus,
            Map<String, Long> byCategory,
            Map<String, Long> byPriority,
            List<AdminPerformance> adminPerformance
    ) {
    }

    public record AdminPerformance(
            Long adminId,
            String adminName,
            long assigned,
            long resolved,
            long activeAssignments
    ) {
    }

    public record AiSuggestRequest(
            @NotBlank(message = "Title is required")
            @Size(max = 160)
            String title,

            @NotBlank(message = "Description is required")
            @Size(max = 5000)
            String description
    ) {
    }

    public record AiSuggestion(
            String category,
            String priority,
            String summary,
            String department,
            boolean available,
            String note
    ) {
    }
}
