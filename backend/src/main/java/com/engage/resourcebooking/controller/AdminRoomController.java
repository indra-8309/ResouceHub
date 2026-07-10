package com.engage.resourcebooking.controller;

import com.engage.resourcebooking.service.BookingService;
import com.engage.resourcebooking.service.RoomService;
import com.engage.resourcebooking.model.Room;
import com.engage.resourcebooking.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/admin/rooms")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoomController {

    @Autowired private RoomRepository roomRepository;
    @Autowired private BookingService bookingService;

    @PostMapping("/{roomId}/active")
    public void toggleActive(@PathVariable Long roomId, @RequestParam boolean active) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        
        room.setActive(active);
        roomRepository.save(room);

        if (!active) {
            bookingService.rejectUpcomingBookingsForRoom(roomId, "Room has been set to inactive status.");
        }
    }
}
