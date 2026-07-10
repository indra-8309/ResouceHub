package com.engage.resourcebooking.controller;

import com.engage.resourcebooking.dto.BookingAuditOut;
import com.engage.resourcebooking.dto.BookingCreate;
import com.engage.resourcebooking.dto.BookingOut;
import com.engage.resourcebooking.dto.BookingUpdate;
import com.engage.resourcebooking.dto.BookingStatusUpdate;
import com.engage.resourcebooking.model.Booking;
import com.engage.resourcebooking.repository.BookingAuditRepository;
import com.engage.resourcebooking.repository.BookingRepository;
import com.engage.resourcebooking.security.UserDetailsImpl;
import com.engage.resourcebooking.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private BookingAuditRepository auditRepository;

    @org.springframework.transaction.annotation.Transactional
    @PostMapping
    public BookingOut createBooking(@RequestBody BookingCreate bookingCreate, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return bookingService.createBooking(bookingCreate, userDetails.getUser());
    }

    @org.springframework.transaction.annotation.Transactional
    @PutMapping("/{bookingId}")
    public BookingOut updateBooking(@PathVariable Long bookingId, @RequestBody BookingUpdate bookingUpdate, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        return bookingService.updateBooking(bookingId, bookingUpdate, userDetails.getUser());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/my")
    public List<BookingOut> getMyBookings(@RequestParam(required = false) Long roomId, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        List<com.engage.resourcebooking.model.Booking> bookings = bookingRepository.findByUserIdOrderByRequestedAtDescIdDesc(userDetails.getId());
        if (roomId != null) {
            bookings = bookings.stream().filter(b -> b.getRoom().getId().equals(roomId)).collect(java.util.stream.Collectors.toList());
        }
        return bookings.stream().map(bookingService::mapToOut).collect(java.util.stream.Collectors.toList());
    }
    
    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/{bookingId}/status")
    public void updateBookingStatus(@PathVariable Long bookingId, @RequestBody BookingStatusUpdate update, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        bookingService.updateBookingStatus(bookingId, update, userDetails.getUser());
    }

    @org.springframework.transaction.annotation.Transactional
    @PostMapping("/batch/{requestId}/status")
    public void updateBatchBookingStatus(@PathVariable String requestId, @RequestBody BookingStatusUpdate update, @AuthenticationPrincipal UserDetailsImpl userDetails) {
        bookingService.updateBatchStatusByRequestId(requestId, update, userDetails.getUser());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/all")
    public List<BookingOut> getAllBookingsPublic(@RequestParam(required = false) Long roomId) {
        List<com.engage.resourcebooking.model.Booking> bookings = bookingRepository.findAll();
        if (roomId != null) {
            bookings = bookings.stream().filter(b -> b.getRoom() != null && b.getRoom().getId().equals(roomId)).collect(java.util.stream.Collectors.toList());
        }
        return bookings.stream().map(bookingService::mapToOut).collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/{bookingId}")
    public BookingOut getBookingDetail(@PathVariable Long bookingId) {
        com.engage.resourcebooking.model.Booking booking = bookingRepository.findById(bookingId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        return bookingService.mapToOut(booking);
    }
    
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/audit-trail")
    public List<BookingAuditOut> getAllAuditLogs() {
        return auditRepository.findAll().stream()
            .filter(a -> {
                String action = a.getAction().toUpperCase();
                return action.equals("APPROVED") || action.equals("REJECTED") || action.equals("CANCELLED");
            })
            .map(a -> {
                BookingAuditOut out = new BookingAuditOut();
                out.setId(a.getId());
                out.setBookingId(a.getBooking().getId());
                out.setAction(a.getAction());
                out.setPerformedBy(a.getUser() != null ? a.getUser().getId() : null);
                if (a.getUser() != null) {
                    com.engage.resourcebooking.dto.UserOut uo = new com.engage.resourcebooking.dto.UserOut();
                    uo.setId(a.getUser().getId());
                    uo.setEmail(a.getUser().getEmail());
                    uo.setFullName(a.getUser().getFullName());
                    uo.setRole(a.getUser().getRole());
                    uo.setApproved(a.getUser().isApproved());
                    out.setUser(uo);
                }
                out.setTimestamp(a.getTimestamp());
                out.setNote(a.getNote());
                return out;
            })
            .sorted((a,b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping("/{bookingId}/audit")
    public List<BookingAuditOut> getBookingAudit(@PathVariable Long bookingId) {
        return auditRepository.findByBookingIdOrderByTimestampAsc(bookingId).stream().map(a -> {
            BookingAuditOut out = new BookingAuditOut();
            out.setId(a.getId());
            out.setBookingId(a.getBooking().getId());
            out.setAction(a.getAction());
            out.setPerformedBy(a.getUser() != null ? a.getUser().getId() : null);
            if (a.getUser() != null) {
                com.engage.resourcebooking.dto.UserOut uo = new com.engage.resourcebooking.dto.UserOut();
                uo.setId(a.getUser().getId());
                uo.setEmail(a.getUser().getEmail());
                uo.setFullName(a.getUser().getFullName());
                uo.setRole(a.getUser().getRole());
                uo.setApproved(a.getUser().isApproved());
                out.setUser(uo);
            }
            out.setTimestamp(a.getTimestamp());
            out.setNote(a.getNote());
            return out;
        }).collect(java.util.stream.Collectors.toList());
    }
}
