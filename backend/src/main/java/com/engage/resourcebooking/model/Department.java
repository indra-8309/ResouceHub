package com.engage.resourcebooking.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "departments_seq_gen")
    @SequenceGenerator(
        name = "departments_seq_gen",
        sequenceName = "departments_SEQ",
        allocationSize = 1
    )
    private Long id;

    @Column(unique = true, nullable = false)
    private String name;

    @OneToMany(mappedBy = "department")
    private List<User> users;
}
