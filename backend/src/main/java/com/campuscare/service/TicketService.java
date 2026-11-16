package com.campuscare.service;

import com.campuscare.dto.AuthDtos;
import com.campuscare.dto.DtoMapper;
import com.campuscare.dto.TicketDtos;
import com.campuscare.exception.ApiException;
import com.campuscare.model.*;
import com.campuscare.repository.*;
import com.campuscare.security.UserPrincipal;
import com.campuscare.util.TicketNumberGenerator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Student-facing complaint submission, tracking and history. */
@Service
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketStatusHistoryRepository historyRepository;
    private final TicketCommentRepository commentRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public TicketService(TicketRepository ticketRepository,
                         TicketStatusHistoryRepository historyRepository,
                         TicketCommentRepository commentRepository,
                         CategoryRepository categoryRepository,
                         UserRepository userRepository) {
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
        this.commentRepository = commentRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TicketDtos.TicketResponse create(Long studentId, TicketDtos.TicketCreateRequest request) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> ApiException.unauthorized("Student account not found."));
        if (!student.isActive()) {
            throw ApiException.forbidden("Your account is deactivated. You cannot submit complaints.");
        }

        Category category = categoryRepository.findById(request.categoryId())
                .filter(Category::isActive)
                .orElseThrow(() -> ApiException.badRequest("Please select a valid active category."));

        Ticket ticket = new Ticket();
        ticket.setTicketNumber(generateUniqueNumber());
        ticket.setStudent(student);
        ticket.setCategory(category);
        ticket.setTitle(request.title().trim());
        ticket.setDescription(request.description().trim());
        ticket.setLocation(request.location().trim());
        ticket.setPriority(request.priority() == null ? Priority.MEDIUM : request.priority());
        ticket.setStatus(TicketStatus.SUBMITTED);

        applyAiSuggestions(ticket, request);

        ticket = ticketRepository.save(ticket);
        historyRepository.save(new TicketStatusHistory(
                ticket, null, TicketStatus.SUBMITTED, student, "Complaint submitted by student."));

        return DtoMapper.toTicketResponse(ticket);
    }

    @Transactional(readOnly = true)
    public TicketDtos.PagedResponse<TicketDtos.TicketResponse> myTickets(
            Long studentId, TicketStatus status, Long categoryId, Priority priority,
            String search, int page, int size) {

        Pageable pageable = pageable(page, size);
        Page<Ticket> tickets = ticketRepository.searchStudentTickets(
                studentId, status, categoryId, priority, safeSearch(search), pageable);

        return new TicketDtos.PagedResponse<>(
                tickets.getContent().stream().map(DtoMapper::toTicketResponse).toList(),
                tickets.getNumber(), tickets.getSize(),
                tickets.getTotalElements(), tickets.getTotalPages());
    }

    @Transactional(readOnly = true)
    public TicketDtos.StudentStats myStats(Long studentId) {
        long submitted = ticketRepository.countByStudentIdAndStatus(studentId, TicketStatus.SUBMITTED);
        long assigned = ticketRepository.countByStudentIdAndStatus(studentId, TicketStatus.ASSIGNED);
        long inProgress = ticketRepository.countByStudentIdAndStatus(studentId, TicketStatus.IN_PROGRESS);
        long resolved = ticketRepository.countByStudentIdAndStatus(studentId, TicketStatus.RESOLVED);
        long closed = ticketRepository.countByStudentIdAndStatus(studentId, TicketStatus.CLOSED);
        long rejected = ticketRepository.countByStudentIdAndStatus(studentId, TicketStatus.REJECTED);
        long open = submitted + assigned + inProgress;

        return new TicketDtos.StudentStats(
                ticketRepository.countByStudentId(studentId),
                submitted, assigned, inProgress, resolved, closed, rejected, open);
    }

    /** Students may only read their own ticket; admins may read any ticket. */
    @Transactional(readOnly = true)
    public TicketDtos.TicketResponse getTicketForUser(Long ticketId, UserPrincipal principal) {
        Ticket ticket = getTicketForUserEntity(ticketId, principal);
        return DtoMapper.toTicketResponse(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketDtos.HistoryResponse> getHistory(Long ticketId, UserPrincipal principal) {
        getTicketForUserEntity(ticketId, principal);
        return historyRepository.findByTicketIdOrderByChangedAtAsc(ticketId).stream()
                .map(history -> new TicketDtos.HistoryResponse(
                        history.getId(),
                        history.getFromStatus(),
                        history.getToStatus(),
                        DtoMapper.toUserSummary(history.getChangedBy()),
                        history.getRemarks(),
                        history.getChangedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TicketDtos.CommentResponse> getComments(Long ticketId, UserPrincipal principal) {
        getTicketForUserEntity(ticketId, principal);
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(comment -> new TicketDtos.CommentResponse(
                        comment.getId(),
                        DtoMapper.toUserSummary(comment.getAuthor()),
                        comment.getMessage(),
                        comment.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public Ticket getTicketForUserEntity(Long ticketId, UserPrincipal principal) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> ApiException.notFound("Ticket not found."));

        if (principal.getRole() == Role.STUDENT
                && !ticket.getStudent().getId().equals(principal.getId())) {
            // Return 404 rather than 403 so students cannot guess other ticket IDs.
            throw ApiException.notFound("Ticket not found.");
        }
        return ticket;
    }

    private void applyAiSuggestions(Ticket ticket, TicketDtos.TicketCreateRequest request) {
        if (request.aiSuggestedCategory() == null || request.aiSuggestedCategory().isBlank()) {
            return;
        }

        String categoryName = request.aiSuggestedCategory().trim();
        boolean categoryExists = categoryRepository.findByNameIgnoreCase(categoryName)
                .map(Category::isActive)
                .orElse(false);
        if (!categoryExists) {
            return;
        }

        Priority aiPriority = null;
        if (request.aiSuggestedPriority() != null) {
            try {
                aiPriority = Priority.valueOf(request.aiSuggestedPriority().trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Invalid AI text is discarded rather than failing the submission.
            }
        }

        ticket.setAiSuggestedCategory(categoryName);
        ticket.setAiSuggestedPriority(aiPriority == null ? null : aiPriority.name());
        ticket.setAiSummary(trimToNull(request.aiSummary()));
        ticket.setAiSuggestedDepartment(trimToNull(request.aiSuggestedDepartment()));
    }

    private String generateUniqueNumber() {
        for (int attempt = 0; attempt < 8; attempt++) {
            String candidate = TicketNumberGenerator.generate();
            if (ticketRepository.findByTicketNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw ApiException.conflict("Could not generate a unique ticket number. Please try again.");
    }

    public static Pageable pageable(int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        return PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    public static String safeSearch(String search) {
        return search == null ? "" : search.trim();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
