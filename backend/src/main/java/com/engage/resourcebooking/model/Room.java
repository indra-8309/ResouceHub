package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "rooms_seq_gen")
    @SequenceGenerator(
        name = "rooms_seq_gen",
        sequenceName = "rooms_SEQ",
        allocationSize = 1
    )
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "resource_type")
    private ResourceType resourceType = ResourceType.ROOM;

    @Column(columnDefinition = "VARCHAR2(4000)")
    private String features; // Store as JSON string

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "needs_approval")
    private boolean needsApproval = true;

    @Column(name = "booking_hours", columnDefinition = "VARCHAR2(1000)")
    private String bookingHours; // Store as JSON string e.g., {"start": "09:00", "end": "18:00"}

    @Column(name = "max_duration_hours")
    private Integer maxDurationHours = 4;

    @Column(name = "allowed_roles", columnDefinition = "VARCHAR2(1000)")
    private String allowedRoles = "[\"employee\", \"manager\", \"admin\"]";

    @Column(name = "allowed_departments", columnDefinition = "VARCHAR2(1000)")
    private String allowedDepartments; // JSON list of IDs

    @Column(name = "buffer_time_minutes")
    private Integer bufferTimeMinutes = 0;

    private String floor;
    private String building;

    @OneToMany(mappedBy = "room")
    private List<Booking> bookings;

    @OneToMany(mappedBy = "room")
    private List<MaintenanceBlock> maintenanceBlocks;

    @OneToMany(mappedBy = "resource")
    private List<ResourceSlot> slots;
    
    // Transient fields for UI responses
    @Transient
    private String status;
    @Transient
    private String statusDetail;
    @Transient
    private String reason;
}
