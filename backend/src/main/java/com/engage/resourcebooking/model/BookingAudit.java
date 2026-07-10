package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_audit")
@Data
@NoArgsConstructor
public class BookingAudit {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "booking_audit_seq_gen")
    @SequenceGenerator(
        name = "booking_audit_seq_gen",
        sequenceName = "booking_audit_SEQ",
        allocationSize = 1
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private User user;

    private LocalDateTime timestamp = LocalDateTime.now();

    private String note;
}
