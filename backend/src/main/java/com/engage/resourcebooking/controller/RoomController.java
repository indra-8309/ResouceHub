package com.engage.resourcebooking.controller;

import com.engage.resourcebooking.dto.MaintenanceBlockOut;
import com.engage.resourcebooking.dto.ResourceSlotOut;
import com.engage.resourcebooking.dto.RoomOut;
import com.engage.resourcebooking.model.MaintenanceBlock;
import com.engage.resourcebooking.model.ResourceSlot;
import com.engage.resourcebooking.repository.MaintenanceBlockRepository;
import com.engage.resourcebooking.repository.ResourceSlotRepository;
import com.engage.resourcebooking.security.UserDetailsImpl;
import com.engage.resourcebooking.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import com.engage.resourcebooking.model.BookingStatus;
import com.engage.resourcebooking.repository.BookingRepository;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    @Autowired
    private RoomService roomService;

    @Autowired
    private ResourceSlotRepository resourceSlotRepository;

    @Autowired
    private MaintenanceBlockRepository maintenanceBlockRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping
    public List<RoomOut> getRooms(
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) List<String> features,
            @RequestParam(required = false) Long roomId,
            @RequestParam(required = false) String name,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return roomService.getRooms(userDetails.getUser(), capacity, features, roomId, name);
    }

    @GetMapping("/search")
    public List<RoomOut> searchRooms(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) List<String> features,
            @RequestParam(required = false) Long roomId,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return roomService.searchRooms(userDetails.getUser(), startTime, endTime, capacity, features, roomId);
    }

    @GetMapping("/{roomId}/slots")
    public List<ResourceSlotOut> getRoomSlots(@PathVariable Long roomId) {
        return resourceSlotRepository.findByResourceId(roomId).stream().map(s -> {
            ResourceSlotOut out = new ResourceSlotOut();
            out.setId(s.getId());
            out.setRoomId(roomId);
            out.setSlotNumber(s.getSlotNumber());
            out.setActive(s.isActive());
            return out;
        }).collect(Collectors.toList());
    }

    @GetMapping("/{roomId}/maintenance")
    public List<MaintenanceBlockOut> getRoomMaintenance(@PathVariable Long roomId) {
        return maintenanceBlockRepository.findByRoomId(roomId).stream().map(m -> {
            MaintenanceBlockOut out = new MaintenanceBlockOut();
            out.setId(m.getId());
            out.setRoomId(roomId);
            out.setStartTime(m.getStartTime());
            out.setEndTime(m.getEndTime());
            out.setReason(m.getReason());
            return out;
        }).collect(Collectors.toList());
    }

    @GetMapping("/{roomId}/booked-slots")
    public List<Long> getRoomBookedSlots(
            @PathVariable Long roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        return bookingRepository.findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), end, start)
                .stream()
                .filter(b -> b.getSlot() != null)
                .map(b -> b.getSlot().getId())
                .distinct()
                .collect(Collectors.toList());
    }
}
