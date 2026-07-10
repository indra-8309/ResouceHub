package com.engage.resourcebooking.dto;

import com.engage.resourcebooking.model.UserRole;

import lombok.Data;


@Data
public class UserOut {
    private Long id;
    private String email;
    private String fullName;
    private UserRole role;
    private boolean isApproved;
    private Long departmentId;
    private Long managerId;
    private String departmentName;

    // Nested objects for frontend display
    private DepartmentRef department;
    private ManagerRef manager;

    @Data
    public static class DepartmentRef {
        private Long id;
        private String name;
    }

    @Data
    public static class ManagerRef {
        private Long id;
        private String fullName;
        private String email;
    }
}
