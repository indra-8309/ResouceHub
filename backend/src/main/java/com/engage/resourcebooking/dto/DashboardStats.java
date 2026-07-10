package com.engage.resourcebooking.dto;

import lombok.Data;

@Data
public class DashboardStats {
    private long totalRooms;
    private long activeRooms;
    private long pendingRequests;
    private long approvedToday;
    private long cancelledToday;
    private String mostBookedRoom;
    private double utilizationRate;
}
