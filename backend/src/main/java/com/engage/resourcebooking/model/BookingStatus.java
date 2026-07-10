package com.engage.resourcebooking.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum BookingStatus {
    PENDING,
    APPROVED,
    REJECTED,
    CANCELLED,
    COMPLETED;

    @JsonCreator
    public static BookingStatus fromString(String value) {
        if (value == null) return null;
        return BookingStatus.valueOf(value.toUpperCase());
    }
}
