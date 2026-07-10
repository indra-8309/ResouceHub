package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_status_history")
@Data
@NoArgsConstructor
public class BookingStatusHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "booking_status_hist_seq_gen")
    @SequenceGenerator(
        name = "booking_status_hist_seq_gen",
        sequenceName = "booking_status_hist_SEQ",
        allocationSize = 1
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    private String status;

    @Column(name = "changed_at")
    private LocalDateTime changedAt = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id")
    private User changedBy;

    private String comment;
}
