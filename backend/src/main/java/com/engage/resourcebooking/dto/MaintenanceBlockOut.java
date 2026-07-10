package com.engage.resourcebooking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MaintenanceBlockOut {
    private Long id;
    private Long roomId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String reason;
}
