package com.campuscare.repository;

import com.campuscare.model.TicketAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketAssignmentRepository extends JpaRepository<TicketAssignment, Long> {

    List<TicketAssignment> findByTicketIdOrderByAssignedAtDesc(Long ticketId);

    long countByAdminId(Long adminId);

    long countByAdminIdAndActiveTrue(Long adminId);

    @Modifying
    @Query("update TicketAssignment a set a.active = false where a.ticket.id = :ticketId and a.active = true")
    int deactivateActiveAssignments(@Param("ticketId") Long ticketId);
}
