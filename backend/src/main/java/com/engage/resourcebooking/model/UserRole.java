package com.engage.resourcebooking.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum UserRole {
    EMPLOYEE,
    MANAGER,
    ADMIN;

    @JsonCreator
    public static UserRole fromString(String value) {
        if (value == null) return null;
        return UserRole.valueOf(value.toUpperCase());
    }
}
