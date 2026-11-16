package com.campuscare.dto;

import com.campuscare.model.Category;
import com.campuscare.model.Ticket;
import com.campuscare.model.User;

/** Small helper that converts database entities into safe API responses. */
public final class DtoMapper {

    private DtoMapper() {
    }

    public static AuthDtos.UserSummary toUserSummary(User user) {
        if (user == null) {
            return null;
        }
        return new AuthDtos.UserSummary(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.getDepartment(),
                user.getCreatedAt()
        );
    }

    public static TicketDtos.CategoryDto toCategoryDto(Category category) {
        if (category == null) {
            return null;
        }
        return new TicketDtos.CategoryDto(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive()
        );
    }

    public static TicketDtos.TicketResponse toTicketResponse(Ticket ticket) {
        return new TicketDtos.TicketResponse(
                ticket.getId(),
                ticket.getTicketNumber(),
                ticket.getTitle(),
                ticket.getDescription(),
                ticket.getLocation(),
                ticket.getPriority(),
                ticket.getStatus(),
                toCategoryDto(ticket.getCategory()),
                toUserSummary(ticket.getStudent()),
                toUserSummary(ticket.getAssignedAdmin()),
                ticket.getAdminRemarks(),
                ticket.getAiSuggestedCategory(),
                ticket.getAiSuggestedPriority(),
                ticket.getAiSummary(),
                ticket.getAiSuggestedDepartment(),
                ticket.getCreatedAt(),
                ticket.getUpdatedAt(),
                ticket.getResolvedAt()
        );
    }
}
