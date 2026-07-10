package com.engage.resourcebooking.dto;

import com.engage.resourcebooking.model.BookingStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class BookingOut {
    private Long id;
    private Long userId;
    private Long roomId;
    private Long slotId;
    private Long routedToId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private BookingStatus status;
    private String managerComment;
    private LocalDateTime requestedAt;
    private Long approvedById;
    private LocalDateTime approvedAt;
    private String requestId;
    
    // We can also embed UserOut and RoomOut if needed by the UI
    private UserOut user;
    private RoomOut room;
    private UserOut approvedBy;
    private UserOut routedTo;
}
