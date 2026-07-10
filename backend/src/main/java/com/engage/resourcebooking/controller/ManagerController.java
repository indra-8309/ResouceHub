package com.engage.resourcebooking.controller;

import com.engage.resourcebooking.dto.BookingOut;
import com.engage.resourcebooking.model.Booking;
import com.engage.resourcebooking.model.BookingStatus;
import com.engage.resourcebooking.model.UserRole;
import com.engage.resourcebooking.repository.BookingRepository;
import com.engage.resourcebooking.security.UserDetailsImpl;
import com.engage.resourcebooking.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/manager")
public class ManagerController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingService bookingService;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public List<BookingOut> getManagerRequests(
            @RequestParam(required = false) Long roomId,
            @RequestParam(defaultValue = "true") boolean pendingOnly,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
            
        List<Booking> bookings;
        if (userDetails.getUser().getRole() == UserRole.ADMIN) {
            bookings = bookingRepository.findAll();
            if (pendingOnly) {
                bookings = bookings.stream()
                    .filter(b -> b.getStatus() == BookingStatus.PENDING)
                    .collect(java.util.stream.Collectors.toList());
            }
        } else {
            bookings = bookingRepository.findByRoutedToIdOrderByRequestedAtDescIdDesc(userDetails.getId());
            if (pendingOnly) {
                bookings = bookings.stream()
                    .filter(b -> b.getStatus() == BookingStatus.PENDING)
                    .collect(java.util.stream.Collectors.toList());
            }
        }
        
        if (roomId != null) {
            bookings = bookings.stream()
                .filter(b -> b.getRoom() != null && b.getRoom().getId().equals(roomId))
                .collect(java.util.stream.Collectors.toList());
        }
        
        return bookings.stream().map(bookingService::mapToOut).collect(java.util.stream.Collectors.toList());
    }
}
