package com.engage.resourcebooking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingUpdate {
    private Long roomId;
    private Long slotId;
    private java.time.LocalDateTime startTime;
    private java.time.LocalDateTime endTime;
    private String purpose;
}
