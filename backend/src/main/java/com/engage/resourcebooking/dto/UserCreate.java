package com.engage.resourcebooking.dto;

import com.engage.resourcebooking.model.UserRole;
import lombok.Data;

@Data
public class UserCreate {
    private String email;
    private String password;
    private String fullName;
    private UserRole role;
    private Long departmentId;
    private Long managerId;
}
