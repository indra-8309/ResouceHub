package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "maintenance_blocks")
@Data
@NoArgsConstructor
public class MaintenanceBlock {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "maint_blocks_seq_gen")
    @SequenceGenerator(
        name = "maint_blocks_seq_gen",
        sequenceName = "maint_blocks_SEQ",
        allocationSize = 1
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    private String reason;
}
