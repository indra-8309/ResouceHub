package com.engage.resourcebooking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MaintenanceBlockCreate {
    private java.time.LocalDateTime startTime;
    private java.time.LocalDateTime endTime;
    private String reason;
}
