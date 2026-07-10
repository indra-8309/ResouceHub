package com.engage.resourcebooking.dto;

import lombok.Data;

@Data
public class ResourceSlotCreate {
    private String slotNumber;
    private boolean isActive = true;
}
