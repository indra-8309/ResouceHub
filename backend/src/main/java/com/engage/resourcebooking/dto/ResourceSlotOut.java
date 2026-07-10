package com.engage.resourcebooking.dto;

import lombok.Data;

@Data
public class ResourceSlotOut {
    private Long id;
    private Long roomId;
    private String slotNumber;
    private boolean isActive;
}
