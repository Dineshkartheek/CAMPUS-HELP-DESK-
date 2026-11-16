package com.campuscare.model;

import jakarta.persistence.*;
import java.time.Instant;

/** Audit record created every time a ticket is assigned to an administrator. */
@Entity
@Table(name = "ticket_assignments", indexes = {
        @Index(name = "idx_assignments_ticket", columnList = "ticket_id"),
        @Index(name = "idx_assignments_admin", columnList = "admin_id")
})
public class TicketAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_by", nullable = false)
    private User assignedBy;

    @Column(length = 255)
    private String note;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt;

    public TicketAssignment() {
    }

    public TicketAssignment(Ticket ticket, User admin, User assignedBy, String note) {
        this.ticket = ticket;
        this.admin = admin;
        this.assignedBy = assignedBy;
        this.note = note;
    }

    @PrePersist
    void onCreate() {
        this.assignedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Ticket getTicket() {
        return ticket;
    }

    public void setTicket(Ticket ticket) {
        this.ticket = ticket;
    }

    public User getAdmin() {
        return admin;
    }

    public void setAdmin(User admin) {
        this.admin = admin;
    }

    public User getAssignedBy() {
        return assignedBy;
    }

    public void setAssignedBy(User assignedBy) {
        this.assignedBy = assignedBy;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }
}
