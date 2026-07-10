package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "resource_slots")
@Data
@NoArgsConstructor
public class ResourceSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "resource_slots_seq_gen")
    @SequenceGenerator(
        name = "resource_slots_seq_gen",
        sequenceName = "resource_slots_SEQ",
        allocationSize = 1
    )
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resource_id")
    private Room resource;

    @Column(name = "slot_number")
    private String slotNumber;

    @Column(name = "is_active")
    private boolean isActive = true;

    @OneToMany(mappedBy = "slot")
    private List<Booking> bookings;
}
