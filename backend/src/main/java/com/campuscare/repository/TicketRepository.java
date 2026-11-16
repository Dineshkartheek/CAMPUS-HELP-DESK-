package com.campuscare.repository;

import com.campuscare.model.Priority;
import com.campuscare.model.Ticket;
import com.campuscare.model.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    Optional<Ticket> findByTicketNumber(String ticketNumber);

    Optional<Ticket> findByIdAndStudentId(Long id, Long studentId);

    long countByStatus(TicketStatus status);

    long countByStudentId(Long studentId);

    long countByStudentIdAndStatus(Long studentId, TicketStatus status);

    long countByStudentIdAndStatusIn(Long studentId, List<TicketStatus> statuses);

    long countByAssignedAdminId(Long adminId);

    long countByAssignedAdminIdAndStatusIn(Long adminId, List<TicketStatus> statuses);

    long countByPriority(Priority priority);

    long countByStatusAndAssignedAdminIsNull(TicketStatus status);

    @Query("""
            select t from Ticket t
            where t.student.id = :studentId
              and (:status is null or t.status = :status)
              and (:categoryId is null or t.category.id = :categoryId)
              and (:priority is null or t.priority = :priority)
              and (:search = '' or lower(t.title) like lower(concat('%', :search, '%'))
                   or lower(t.ticketNumber) like lower(concat('%', :search, '%')))
            """)
    Page<Ticket> searchStudentTickets(
            @Param("studentId") Long studentId,
            @Param("status") TicketStatus status,
            @Param("categoryId") Long categoryId,
            @Param("priority") Priority priority,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            select t from Ticket t
            where (:status is null or t.status = :status)
              and (:categoryId is null or t.category.id = :categoryId)
              and (:priority is null or t.priority = :priority)
              and (:assignedAdminId is null or t.assignedAdmin.id = :assignedAdminId)
              and (:fromDate is null or t.createdAt >= :fromDate)
              and (:toDate is null or t.createdAt <= :toDate)
              and (:search = '' or lower(t.title) like lower(concat('%', :search, '%'))
                   or lower(t.ticketNumber) like lower(concat('%', :search, '%'))
                   or lower(t.student.fullName) like lower(concat('%', :search, '%'))
                   or lower(t.student.email) like lower(concat('%', :search, '%')))
            """)
    Page<Ticket> searchAllTickets(
            @Param("status") TicketStatus status,
            @Param("categoryId") Long categoryId,
            @Param("priority") Priority priority,
            @Param("assignedAdminId") Long assignedAdminId,
            @Param("fromDate") Instant fromDate,
            @Param("toDate") Instant toDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
            select t from Ticket t
            where (:fromDate is null or t.createdAt >= :fromDate)
              and (:toDate is null or t.createdAt <= :toDate)
            order by t.createdAt desc
            """)
    List<Ticket> findForReport(@Param("fromDate") Instant fromDate, @Param("toDate") Instant toDate);

    @Query("select t.category.name, count(t) from Ticket t group by t.category.name order by t.category.name")
    List<Object[]> countGroupedByCategory();

    @Query("select t.status, count(t) from Ticket t group by t.status")
    List<Object[]> countGroupedByStatus();

    @Query("select t.priority, count(t) from Ticket t group by t.priority")
    List<Object[]> countGroupedByPriority();
}
