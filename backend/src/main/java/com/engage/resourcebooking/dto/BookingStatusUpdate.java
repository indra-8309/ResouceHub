package com.engage.resourcebooking.dto;

import com.engage.resourcebooking.model.BookingStatus;
import lombok.Data;

@Data
public class BookingStatusUpdate {
    private BookingStatus status;
    private String managerComment;
}
