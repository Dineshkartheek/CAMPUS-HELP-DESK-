package com.campuscare.dto;

import com.campuscare.model.Priority;
import com.campuscare.model.TicketStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;

/** Request and response objects used by ticket endpoints. */
public final class TicketDtos {

    private TicketDtos() {
    }

    public record TicketCreateRequest(
            @NotNull(message = "Please select a category")
            Long categoryId,

            @NotBlank(message = "Complaint title is required")
            @Size(max = 160, message = "Title must be 160 characters or less")
            String title,

            @NotBlank(message = "Complaint description is required")
            @Size(max = 5000, message = "Description must be 5000 characters or less")
            String description,

            @NotBlank(message = "Campus location is required")
            @Size(max = 180, message = "Location must be 180 characters or less")
            String location,

            Priority priority,

            // Optional suggestions returned by our own AI endpoint and confirmed by the student.
            @Size(max = 80) String aiSuggestedCategory,
            @Size(max = 20) String aiSuggestedPriority,
            @Size(max = 500) String aiSummary,
            @Size(max = 120) String aiSuggestedDepartment
    ) {
    }

    public record CategoryDto(
            Long id,
            String name,
            String description,
            boolean active
    ) {
    }

    public record TicketResponse(
            Long id,
            String ticketNumber,
            String title,
            String description,
            String location,
            Priority priority,
            TicketStatus status,
            CategoryDto category,
            AuthDtos.UserSummary student,
            AuthDtos.UserSummary assignedAdmin,
            String adminRemarks,
            String aiSuggestedCategory,
            String aiSuggestedPriority,
            String aiSummary,
            String aiSuggestedDepartment,
            Instant createdAt,
            Instant updatedAt,
            Instant resolvedAt
    ) {
    }

    public record StatusUpdateRequest(
            @NotNull(message = "Status is required")
            TicketStatus status,

            @Size(max = 2000, message = "Remarks must be 2000 characters or less")
            String remarks
    ) {
    }

    public record AssignRequest(
            @NotNull(message = "Administrator is required")
            Long adminId,

            @Size(max = 255, message = "Note must be 255 characters or less")
            String note
    ) {
    }

    public record CommentRequest(
            @NotBlank(message = "Message is required")
            @Size(max = 2000, message = "Message must be 2000 characters or less")
            String message
    ) {
    }

    public record CommentResponse(
            Long id,
            AuthDtos.UserSummary author,
            String message,
            Instant createdAt
    ) {
    }

    public record HistoryResponse(
            Long id,
            TicketStatus fromStatus,
            TicketStatus toStatus,
            AuthDtos.UserSummary changedBy,
            String remarks,
            Instant changedAt
    ) {
    }

    public record PagedResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages
    ) {
    }

    public record StudentStats(
            long total,
            long submitted,
            long assigned,
            long inProgress,
            long resolved,
            long closed,
            long rejected,
            long open
    ) {
    }
}
