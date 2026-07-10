package com.engage.resourcebooking.dto;

import com.engage.resourcebooking.model.ResourceType;
import lombok.Data;
import java.util.List;

@Data
public class RoomCreate {
    private String name;
    private Integer capacity;
    private com.engage.resourcebooking.model.ResourceType resourceType;
    private java.util.List<String> features;
    private boolean isActive;
    private boolean needsApproval;
    private String bookingHours;
    private Integer maxDurationHours;
    private java.util.List<String> allowedRoles;
    private java.util.List<Long> allowedDepartments;
    private Integer bufferTimeMinutes;
    private String floor;
    private String building;
}
