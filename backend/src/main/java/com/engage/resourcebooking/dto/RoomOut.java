package com.engage.resourcebooking.dto;

import com.engage.resourcebooking.model.ResourceType;
import lombok.Data;
import java.util.List;

@Data
public class RoomOut {
    private Long id;
    private String name;
    private Integer capacity;
    private ResourceType resourceType;
    private List<String> features;
    private boolean isActive;
    private boolean needsApproval;
    private String bookingHours;
    private Integer maxDurationHours;
    private List<String> allowedRoles;
    private List<Long> allowedDepartments;
    private Integer bufferTimeMinutes;
    private String floor;
    private String building;
    private String status;
    private String statusDetail;
    private String reason;
}
