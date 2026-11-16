package com.campuscare.service;

import com.campuscare.dto.AdminDtos;
import com.campuscare.dto.AuthDtos;
import com.campuscare.dto.DtoMapper;
import com.campuscare.dto.TicketDtos;
import com.campuscare.exception.ApiException;
import com.campuscare.model.*;
import com.campuscare.repository.*;
import com.campuscare.security.UserPrincipal;
import com.campuscare.util.CsvUtil;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** Ticket management used by ADMIN and MAIN_ADMIN accounts. */
@Service
public class AdminService {

    private static final Map<TicketStatus, Set<TicketStatus>> ALLOWED_TRANSITIONS = Map.of(
            TicketStatus.SUBMITTED, EnumSet.of(TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.REJECTED),
            TicketStatus.ASSIGNED, EnumSet.of(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.REJECTED),
            TicketStatus.IN_PROGRESS, EnumSet.of(TicketStatus.RESOLVED, TicketStatus.REJECTED),
            TicketStatus.RESOLVED, EnumSet.of(TicketStatus.CLOSED, TicketStatus.IN_PROGRESS),
            TicketStatus.CLOSED, EnumSet.of(TicketStatus.IN_PROGRESS),
            TicketStatus.REJECTED, EnumSet.of(TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS)
    );

    private final TicketRepository ticketRepository;
    private final TicketStatusHistoryRepository historyRepository;
    private final TicketCommentRepository commentRepository;
    private final TicketAssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public AdminService(TicketRepository ticketRepository,
                        TicketStatusHistoryRepository historyRepository,
                        TicketCommentRepository commentRepository,
                        TicketAssignmentRepository assignmentRepository,
                        UserRepository userRepository,
                        CategoryRepository categoryRepository) {
        this.ticketRepository = ticketRepository;
        this.historyRepository = historyRepository;
        this.commentRepository = commentRepository;
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public TicketDtos.PagedResponse<TicketDtos.TicketResponse> listTickets(
            TicketStatus status, Long categoryId, Priority priority, Long assignedAdminId,
            LocalDate from, LocalDate to, String search, int page, int size) {

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Ticket> tickets = ticketRepository.searchAllTickets(
                status, categoryId, priority, assignedAdminId,
                startOfDay(from), endOfDay(to), TicketService.safeSearch(search), pageable);

        return new TicketDtos.PagedResponse<>(
                tickets.getContent().stream().map(DtoMapper::toTicketResponse).toList(),
                tickets.getNumber(), tickets.getSize(),
                tickets.getTotalElements(), tickets.getTotalPages());
    }

    @Transactional(readOnly = true)
    public AdminDtos.AdminDashboardStats dashboard() {
        long submitted = ticketRepository.countByStatus(TicketStatus.SUBMITTED);
        long assigned = ticketRepository.countByStatus(TicketStatus.ASSIGNED);
        long inProgress = ticketRepository.countByStatus(TicketStatus.IN_PROGRESS);
        long resolved = ticketRepository.countByStatus(TicketStatus.RESOLVED);
        long closed = ticketRepository.countByStatus(TicketStatus.CLOSED);
        long rejected = ticketRepository.countByStatus(TicketStatus.REJECTED);

        return new AdminDtos.AdminDashboardStats(
                ticketRepository.count(),
                submitted, assigned, inProgress, resolved, closed, rejected,
                ticketRepository.countByStatusAndAssignedAdminIsNull(TicketStatus.SUBMITTED),
                ticketRepository.countByPriority(Priority.URGENT),
                userRepository.countByRole(Role.STUDENT),
                userRepository.countByRole(Role.ADMIN) + userRepository.countByRole(Role.MAIN_ADMIN),
                categoryRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public TicketDtos.TicketResponse getTicket(Long id) {
        return DtoMapper.toTicketResponse(findTicket(id));
    }

    @Transactional
    public TicketDtos.TicketResponse assign(Long ticketId, TicketDtos.AssignRequest request, UserPrincipal actor) {
        Ticket ticket = findTicket(ticketId);
        User admin = userRepository.findById(request.adminId())
                .orElseThrow(() -> ApiException.notFound("Administrator not found."));

        if (!admin.isActive() || (admin.getRole() != Role.ADMIN && admin.getRole() != Role.MAIN_ADMIN)) {
            throw ApiException.badRequest("Please select an active administrator.");
        }

        User assignedBy = findUser(actor.getId());
        assignmentRepository.deactivateActiveAssignments(ticketId);

        TicketStatus previousStatus = ticket.getStatus();
        ticket.setAssignedAdmin(admin);
        if (previousStatus == TicketStatus.SUBMITTED || previousStatus == TicketStatus.REJECTED) {
            ticket.setStatus(TicketStatus.ASSIGNED);
        }
        ticketRepository.save(ticket);

        assignmentRepository.save(new TicketAssignment(
                ticket, admin, assignedBy, trimToNull(request.note())));

        if (previousStatus != ticket.getStatus()) {
            historyRepository.save(new TicketStatusHistory(
                    ticket, previousStatus, ticket.getStatus(), assignedBy,
                    "Assigned to " + admin.getFullName() + (request.note() == null ? "" : ". " + request.note().trim())));
        }

        return DtoMapper.toTicketResponse(ticket);
    }

    @Transactional
    public TicketDtos.TicketResponse updateStatus(Long ticketId, TicketDtos.StatusUpdateRequest request,
                                                  UserPrincipal actor) {
        Ticket ticket = findTicket(ticketId);
        User changedBy = findUser(actor.getId());

        TicketStatus previous = ticket.getStatus();
        TicketStatus next = request.status();

        if (previous == next) {
            throw ApiException.badRequest("The ticket is already in " + next.name() + " status.");
        }

        Set<TicketStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(previous, Set.of());
        if (!allowed.contains(next)) {
            throw ApiException.badRequest(
                    "Status cannot change from " + previous.name() + " to " + next.name() + ".");
        }

        ticket.setStatus(next);
        if (request.remarks() != null && !request.remarks().isBlank()) {
            ticket.setAdminRemarks(request.remarks().trim());
        }

        if (next == TicketStatus.RESOLVED || next == TicketStatus.CLOSED) {
            if (ticket.getResolvedAt() == null) {
                ticket.setResolvedAt(Instant.now());
            }
        } else {
            ticket.setResolvedAt(null);
        }

        ticketRepository.save(ticket);
        historyRepository.save(new TicketStatusHistory(
                ticket, previous, next, changedBy, trimToNull(request.remarks())));

        return DtoMapper.toTicketResponse(ticket);
    }

    @Transactional
    public TicketDtos.CommentResponse addComment(Long ticketId, TicketDtos.CommentRequest request,
                                                 UserPrincipal actor) {
        Ticket ticket = findTicket(ticketId);
        User author = findUser(actor.getId());
        TicketComment comment = commentRepository.save(
                new TicketComment(ticket, author, request.message().trim()));

        return new TicketDtos.CommentResponse(
                comment.getId(), DtoMapper.toUserSummary(author),
                comment.getMessage(), comment.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.UserSummary> listActiveAdmins() {
        List<User> admins = new ArrayList<>();
        admins.addAll(userRepository.findByRoleAndActiveTrueOrderByFullNameAsc(Role.ADMIN));
        admins.addAll(userRepository.findByRoleAndActiveTrueOrderByFullNameAsc(Role.MAIN_ADMIN));
        return admins.stream().map(DtoMapper::toUserSummary).toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportTicketsCsv(TicketStatus status, Long categoryId, Priority priority,
                                   Long assignedAdminId, LocalDate from, LocalDate to, String search) {
        Pageable pageable = PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "createdAt"));
        List<Ticket> tickets = ticketRepository.searchAllTickets(
                status, categoryId, priority, assignedAdminId,
                startOfDay(from), endOfDay(to), TicketService.safeSearch(search), pageable).getContent();

        StringBuilder csv = new StringBuilder();
        csv.append(CsvUtil.row("Ticket Number", "Created At", "Student", "Student Email", "Category",
                "Title", "Location", "Priority", "Status", "Assigned Admin", "Admin Remarks"));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
                .withZone(ZoneOffset.UTC);
        for (Ticket ticket : tickets) {
            csv.append(CsvUtil.row(
                    ticket.getTicketNumber(),
                    formatter.format(ticket.getCreatedAt()),
                    ticket.getStudent().getFullName(),
                    ticket.getStudent().getEmail(),
                    ticket.getCategory().getName(),
                    ticket.getTitle(),
                    ticket.getLocation(),
                    ticket.getPriority().name(),
                    ticket.getStatus().name(),
                    ticket.getAssignedAdmin() == null ? "" : ticket.getAssignedAdmin().getFullName(),
                    ticket.getAdminRemarks() == null ? "" : ticket.getAdminRemarks()
            ));
        }
        return CsvUtil.toBytes(csv.toString());
    }

    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Ticket not found."));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.unauthorized("Account not found."));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    public static Instant startOfDay(LocalDate date) {
        return date == null ? null : date.atStartOfDay(ZoneOffset.UTC).toInstant();
    }

    public static Instant endOfDay(LocalDate date) {
        return date == null ? null : date.plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant().minusMillis(1);
    }
}
