package com.engage.resourcebooking.model;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum ResourceType {
    ROOM,
    PARKING,
    SHUTTLE;

    @JsonCreator
    public static ResourceType fromString(String value) {
        if (value == null) return null;
        return ResourceType.valueOf(value.toUpperCase());
    }
}
