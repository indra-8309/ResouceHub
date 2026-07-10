package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "audit_logs_seq_gen")
    @SequenceGenerator(
        name = "audit_logs_seq_gen",
        sequenceName = "audit_logs_SEQ",
        allocationSize = 1
    )
    private Long id;

    private String action;

    @Column(columnDefinition = "VARCHAR2(4000)")
    private String details; // Store JSON as string

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private LocalDateTime timestamp = LocalDateTime.now();
}
