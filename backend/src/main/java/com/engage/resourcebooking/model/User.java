package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "users_seq_gen")
    @SequenceGenerator(
        name = "users_seq_gen",
        sequenceName = "users_SEQ",
        allocationSize = 1
    )
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "hashed_password", nullable = false)
    private String hashedPassword;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.EMPLOYEE;

    @Column(name = "is_approved")
    private boolean isApproved = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @OneToMany(mappedBy = "manager")
    private List<User> managedEmployees;

    @OneToMany(mappedBy = "user")
    private List<Booking> bookings;

    @OneToMany(mappedBy = "routedTo")
    private List<Booking> routedBookings;
}
