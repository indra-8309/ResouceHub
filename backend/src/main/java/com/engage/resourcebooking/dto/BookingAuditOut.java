package com.engage.resourcebooking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingAuditOut {
    private Long id;
    private Long bookingId;
    private String action;
    private Long performedBy;
    private UserOut user;
    private LocalDateTime timestamp;
    private String note;
}
