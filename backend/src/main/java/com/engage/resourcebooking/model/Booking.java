package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "bookings_seq_gen")
    @SequenceGenerator(
        name = "bookings_seq_gen",
        sequenceName = "bookings_SEQ",
        allocationSize = 1
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "slot_id")
    private ResourceSlot slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "routed_to_id")
    private User routedTo;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    private String purpose;

    @Enumerated(EnumType.STRING)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "manager_comment")
    private String managerComment;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "request_id")
    private String requestId;

    @OneToMany(mappedBy = "booking")
    private List<BookingStatusHistory> statusHistory;

    @OneToMany(mappedBy = "booking")
    private List<BookingAudit> auditTrail;
}
