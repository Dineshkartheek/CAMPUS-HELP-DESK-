package com.campuscare.service;

import com.campuscare.dto.AdminDtos;
import com.campuscare.dto.AuthDtos;
import com.campuscare.dto.DtoMapper;
import com.campuscare.exception.ApiException;
import com.campuscare.model.*;
import com.campuscare.repository.*;
import com.campuscare.util.CsvUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

/** User administration, statistics and confidential reports for MAIN_ADMIN only. */
@Service
public class MainAdminService {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final TicketAssignmentRepository assignmentRepository;
    private final CategoryRepository categoryRepository;
    private final AdminService adminService;
    private final PasswordEncoder passwordEncoder;

    public MainAdminService(UserRepository userRepository,
                            TicketRepository ticketRepository,
                            TicketAssignmentRepository assignmentRepository,
                            CategoryRepository categoryRepository,
                            AdminService adminService,
                            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.ticketRepository = ticketRepository;
        this.assignmentRepository = assignmentRepository;
        this.categoryRepository = categoryRepository;
        this.adminService = adminService;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public AdminDtos.AdminDashboardStats dashboard() {
        return adminService.dashboard();
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.UserSummary> listUsers(Role role, String search) {
        return userRepository.searchUsers(role, TicketService.safeSearch(search))
                .stream().map(DtoMapper::toUserSummary).toList();
    }

    /** Only ADMIN and MAIN_ADMIN accounts can be created here. */
    @Transactional
    public AuthDtos.UserSummary createAdmin(AdminDtos.AdminCreateRequest request) {
        if (request.role() == Role.STUDENT) {
            throw ApiException.badRequest("Student accounts must use the public registration page.");
        }

        String email = AuthService.normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account with this email already exists.");
        }

        User user = new User(
                request.fullName().trim(),
                email,
                passwordEncoder.encode(request.password()),
                request.role(),
                trimToNull(request.department())
        );
        return DtoMapper.toUserSummary(userRepository.save(user));
    }

    @Transactional
    public AuthDtos.UserSummary updateUserStatus(Long userId, boolean active, Long actorId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found."));

        if (user.getId().equals(actorId) && !active) {
            throw ApiException.badRequest("You cannot deactivate your own account.");
        }

        if (user.getRole() == Role.MAIN_ADMIN && !active
                && userRepository.countByRoleAndActiveTrue(Role.MAIN_ADMIN) <= 1) {
            throw ApiException.badRequest("At least one active Main Administrator must remain.");
        }

        user.setActive(active);
        return DtoMapper.toUserSummary(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public AdminDtos.ReportResponse generateReport(LocalDate from, LocalDate to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw ApiException.badRequest("The start date cannot be after the end date.");
        }

        List<Ticket> tickets = ticketRepository.findForReport(
                AdminService.startOfDay(from), AdminService.endOfDay(to));

        Map<String, Long> byStatus = new LinkedHashMap<>();
        Map<String, Long> byCategory = new LinkedHashMap<>();
        Map<String, Long> byPriority = new LinkedHashMap<>();

        for (TicketStatus status : TicketStatus.values()) {
            byStatus.put(status.name(), 0L);
        }
        for (Priority priority : Priority.values()) {
            byPriority.put(priority.name(), 0L);
        }
        categoryRepository.findAllByOrderByNameAsc()
                .forEach(category -> byCategory.put(category.getName(), 0L));

        for (Ticket ticket : tickets) {
            byStatus.merge(ticket.getStatus().name(), 1L, Long::sum);
            byCategory.merge(ticket.getCategory().getName(), 1L, Long::sum);
            byPriority.merge(ticket.getPriority().name(), 1L, Long::sum);
        }

        List<AdminDtos.AdminPerformance> performance = new ArrayList<>();
        for (User admin : userRepository.findByRoleOrderByFullNameAsc(Role.ADMIN)) {
            performance.add(new AdminDtos.AdminPerformance(
                    admin.getId(),
                    admin.getFullName(),
                    assignmentRepository.countByAdminId(admin.getId()),
                    ticketRepository.countByAssignedAdminIdAndStatusIn(
                            admin.getId(), List.of(TicketStatus.RESOLVED, TicketStatus.CLOSED)),
                    assignmentRepository.countByAdminIdAndActiveTrue(admin.getId())
            ));
        }

        return new AdminDtos.ReportResponse(
                Instant.now(), from, to, tickets.size(),
                byStatus, byCategory, byPriority, performance);
    }

    @Transactional(readOnly = true)
    public byte[] reportCsv(LocalDate from, LocalDate to) {
        AdminDtos.ReportResponse report = generateReport(from, to);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'")
                .withZone(java.time.ZoneOffset.UTC);

        StringBuilder csv = new StringBuilder();
        csv.append(CsvUtil.row("CAMPUSCARE - CONFIDENTIAL CAMPUS SUPPORT REPORT"));
        csv.append(CsvUtil.row("Generated At", formatter.format(report.generatedAt())));
        csv.append(CsvUtil.row("Period", displayPeriod(from, to)));
        csv.append(CsvUtil.row("Total Tickets", String.valueOf(report.totalTickets())));
        csv.append("\r\n");

        csv.append(CsvUtil.row("TICKETS BY STATUS", "COUNT"));
        report.byStatus().forEach((key, value) -> csv.append(CsvUtil.row(key, String.valueOf(value))));
        csv.append("\r\n");

        csv.append(CsvUtil.row("TICKETS BY CATEGORY", "COUNT"));
        report.byCategory().forEach((key, value) -> csv.append(CsvUtil.row(key, String.valueOf(value))));
        csv.append("\r\n");

        csv.append(CsvUtil.row("TICKETS BY PRIORITY", "COUNT"));
        report.byPriority().forEach((key, value) -> csv.append(CsvUtil.row(key, String.valueOf(value))));
        csv.append("\r\n");

        csv.append(CsvUtil.row("ADMINISTRATOR", "TOTAL ASSIGNMENTS", "RESOLVED/CLOSED", "ACTIVE ASSIGNMENTS"));
        for (AdminDtos.AdminPerformance item : report.adminPerformance()) {
            csv.append(CsvUtil.row(
                    item.adminName(),
                    String.valueOf(item.assigned()),
                    String.valueOf(item.resolved()),
                    String.valueOf(item.activeAssignments())
            ));
        }
        return CsvUtil.toBytes(csv.toString());
    }

    private String displayPeriod(LocalDate from, LocalDate to) {
        if (from == null && to == null) {
            return "All time";
        }
        return (from == null ? "Beginning" : from.toString())
                + " to " + (to == null ? "today" : to.toString());
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
