package com.engage.resourcebooking.dto;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class BookingCreate {
    private Long roomId;
    private Long slotId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private String requestId;
}
