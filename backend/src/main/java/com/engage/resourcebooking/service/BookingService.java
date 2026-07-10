package com.engage.resourcebooking.service;

import com.engage.resourcebooking.dto.BookingCreate;
import com.engage.resourcebooking.dto.BookingOut;
import com.engage.resourcebooking.dto.BookingStatusUpdate;
import com.engage.resourcebooking.dto.BookingUpdate;
import com.engage.resourcebooking.model.*;
import com.engage.resourcebooking.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private ResourceSlotRepository slotRepository;

    @Autowired
    private MaintenanceBlockRepository maintenanceBlockRepository;

    @Autowired
    private RoomService roomService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookingAuditRepository auditRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @org.springframework.transaction.annotation.Transactional
    public BookingOut createBooking(BookingCreate bookingCreate, User currentUser) {
        User attachedUser = userRepository.findById(currentUser.getId()).orElse(currentUser);
        if (!bookingCreate.getEndTime().isAfter(bookingCreate.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        if (bookingCreate.getStartTime().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected time slot is in the past.");
        }

        Room room = roomRepository.findById(bookingCreate.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));

        validatePolicy(room, bookingCreate.getStartTime(), bookingCreate.getEndTime(), attachedUser, null);
        checkConflicts(room, bookingCreate.getStartTime(), bookingCreate.getEndTime(), bookingCreate.getSlotId(), null);

        Booking booking = new Booking();
        booking.setUser(attachedUser);
        booking.setRoom(room);
        booking.setStartTime(bookingCreate.getStartTime());
        booking.setEndTime(bookingCreate.getEndTime());
        booking.setPurpose(bookingCreate.getPurpose());
        booking.setRequestId(bookingCreate.getRequestId());

        if (bookingCreate.getSlotId() != null) {
            ResourceSlot slot = slotRepository.findById(bookingCreate.getSlotId()).orElse(null);
            booking.setSlot(slot);
        }

        User routedTo = null;
        if (!room.isNeedsApproval()) {
            booking.setStatus(BookingStatus.APPROVED);
        } else if (currentUser.getRole() == UserRole.ADMIN || currentUser.getRole() == UserRole.MANAGER) {
            booking.setStatus(BookingStatus.APPROVED);
        } else {
            booking.setStatus(BookingStatus.PENDING);
            if (currentUser.getManager() != null) {
                routedTo = currentUser.getManager();
            } else {
                routedTo = userRepository.findAll().stream().filter(u -> u.getRole() == UserRole.ADMIN).findFirst()
                        .orElse(null);
            }
        }
        booking.setRoutedTo(routedTo);

        bookingRepository.save(booking);

        // Only audit "CREATED" for manual review cases, or as a base record
        createAudit(booking, "CREATED", currentUser, null);

        return mapToOut(booking);
    }

    @org.springframework.transaction.annotation.Transactional
    public BookingOut updateBooking(Long bookingId, BookingUpdate bookingUpdate, User currentUser) {
        User attachedUser = userRepository.findById(currentUser.getId()).orElse(currentUser);
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if (!booking.getUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner can edit");
        }

        if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Cannot edit a booking that is already rejected or cancelled");
        }

        if (!bookingUpdate.getEndTime().isAfter(bookingUpdate.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        if (bookingUpdate.getStartTime().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected time slot is in the past.");
        }

        Room room = roomRepository.findById(bookingUpdate.getRoomId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));

        validatePolicy(room, bookingUpdate.getStartTime(), bookingUpdate.getEndTime(), attachedUser, bookingId);
        checkConflicts(room, bookingUpdate.getStartTime(), bookingUpdate.getEndTime(), bookingUpdate.getSlotId(),
                bookingId);

        // Update fields
        booking.setRoom(room);
        if (bookingUpdate.getSlotId() != null) {
            booking.setSlot(slotRepository.findById(bookingUpdate.getSlotId()).orElse(null));
        } else {
            booking.setSlot(null);
        }
        booking.setStartTime(bookingUpdate.getStartTime());
        booking.setEndTime(bookingUpdate.getEndTime());
        booking.setPurpose(bookingUpdate.getPurpose());

        bookingRepository.save(booking);

        createAudit(booking, "UPDATED", currentUser, null);

        return mapToOut(booking);
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateBookingStatus(Long bookingId, BookingStatusUpdate update, User currentUserDetached) {
        User currentUser = userRepository.findById(currentUserDetached.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        updateStatusInternal(booking, update, currentUser);
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateBatchStatusByRequestId(String requestId, BookingStatusUpdate update, User currentUserDetached) {
        User currentUser = userRepository.findById(currentUserDetached.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        List<Booking> bookings = bookingRepository.findByRequestId(requestId);
        if (bookings.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No bookings found for batch request ID: " + requestId);
        }
        // Update all in batch
        for (Booking b : bookings) {
            applyStatusChange(b, update, currentUser);
        }
    }

    private void updateStatusInternal(Booking booking, BookingStatusUpdate update, User currentUser) {
        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isRoutedTo = booking.getRoutedTo() != null && booking.getRoutedTo().getId().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == com.engage.resourcebooking.model.UserRole.ADMIN;

        boolean canProceed = isAdmin || isRoutedTo || (isOwner && com.engage.resourcebooking.model.BookingStatus.CANCELLED.equals(update.getStatus()));

        if (!canProceed) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access Denied.");
        }

        if (booking.getRequestId() != null) {
            List<Booking> group = bookingRepository.findByRequestId(booking.getRequestId());
            for (Booking b : group) {
                applyStatusChange(b, update, currentUser);
            }
        } else {
            applyStatusChange(booking, update, currentUser);
        }
    }

    private void applyStatusChange(Booking b, BookingStatusUpdate update, User currentUser) {
        try {
            com.engage.resourcebooking.model.BookingStatus status = update.getStatus();
            b.setStatus(status);
            b.setManagerComment(update.getManagerComment());
            if (status == com.engage.resourcebooking.model.BookingStatus.APPROVED || status == com.engage.resourcebooking.model.BookingStatus.REJECTED) {
                b.setApprovedBy(currentUser);
                b.setApprovedAt(LocalDateTime.now());
            }
            bookingRepository.save(b);
            createAudit(b, status.name(), currentUser, update.getManagerComment());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + update.getStatus());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void rejectUpcomingBookingsForRoom(Long roomId, String reason) {
        List<Booking> upcoming = bookingRepository.findByRoomIdOrderByRequestedAtDesc(roomId).stream()
                .filter(b -> b.getEndTime().isAfter(LocalDateTime.now()))
                .filter(b -> b.getStatus() == BookingStatus.PENDING || b.getStatus() == BookingStatus.APPROVED)
                .collect(Collectors.toList());

        for (Booking b : upcoming) {
            b.setStatus(BookingStatus.REJECTED);
            b.setManagerComment(reason);
            bookingRepository.save(b);
            createAudit(b, "REJECTED", null, reason);
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void rejectBookingsInMaintenanceRange(Long roomId, LocalDateTime start, LocalDateTime end, String reason) {
        List<Booking> overlapping = bookingRepository.findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                roomId, Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), end, start);

        for (Booking b : overlapping) {
            b.setStatus(BookingStatus.REJECTED);
            b.setManagerComment("Maintenance: " + reason);
            bookingRepository.save(b);
            createAudit(b, "REJECTED", null, "Cancelled due to scheduled maintenance: " + reason);
        }
    }

    private void validatePolicy(Room room, LocalDateTime start, LocalDateTime end, User user, Long skipBookingId) {
        // Role restriction check
        if (user.getRole() != UserRole.ADMIN && room.getAllowedRoles() != null && !room.getAllowedRoles().isEmpty()) {
            String userRoleLower = user.getRole().name().toLowerCase();
            if (!room.getAllowedRoles().toLowerCase().contains(userRoleLower)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Your role is not authorized to book this resource.");
            }
        }

        // Department restriction check
        if (user.getRole() != UserRole.ADMIN && room.getAllowedDepartments() != null
                && !room.getAllowedDepartments().isEmpty()
                && !room.getAllowedDepartments().equals("[]")) {
            try {
                List<Long> allowedDepts = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                        room.getAllowedDepartments(), new com.fasterxml.jackson.core.type.TypeReference<List<Long>>() {
                        });
                if (user.getDepartment() == null || !allowedDepts.contains(user.getDepartment().getId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "Your department is not authorized to book this resource.");
                }
            } catch (ResponseStatusException rse) {
                throw rse;
            } catch (Exception e) {
                // If parsing fails, default to restricted if not admin
                if (user.getDepartment() == null) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Department authorization required.");
                }
            }
        }

        // Max duration check
        long requestedMinutes = java.time.Duration.between(start, end).toMinutes();
        if (room.getMaxDurationHours() != null && requestedMinutes > room.getMaxDurationHours() * 60) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Booking duration exceeds the maximum allowed of " + room.getMaxDurationHours() + " hour(s).");
        }

        // Booking hours check (e.g., {"start": "09:00", "end": "18:00"})
        if (room.getBookingHours() != null && !room.getBookingHours().isEmpty()) {
            try {
                String bh = room.getBookingHours();
                String startStr = bh.replaceAll(".*\"start\"\\s*:\\s*\"([^\"]+)\".*", "$1");
                String endStr = bh.replaceAll(".*\"end\"\\s*:\\s*\"([^\"]+)\".*", "$1");
                java.time.LocalTime allowedStart = java.time.LocalTime.parse(startStr);
                java.time.LocalTime allowedEnd = java.time.LocalTime.parse(endStr);
                java.time.LocalTime bookStart = start.toLocalTime();
                java.time.LocalTime bookEnd = end.toLocalTime();
                if (bookStart.isBefore(allowedStart) || bookEnd.isAfter(allowedEnd)) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Booking failed: Requested time is beyond office hours (" + startStr + " - " + endStr
                                    + ").");
                }
            } catch (ResponseStatusException rse) {
                throw rse;
            } catch (Exception ignored) {
                // If parsing fails, skip the check
            }
        }

        // Buffer time check — ensure no overlapping booking within buffer window
        if (room.getBufferTimeMinutes() != null && room.getBufferTimeMinutes() > 0) {
            LocalDateTime bufferedStart = start.minusMinutes(room.getBufferTimeMinutes());
            LocalDateTime bufferedEnd = end.plusMinutes(room.getBufferTimeMinutes());
            List<Booking> nearbyBookings = bookingRepository
                    .findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                            room.getId(), Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), bufferedEnd,
                            bufferedStart);
            if (skipBookingId != null) {
                nearbyBookings = nearbyBookings.stream().filter(b -> !b.getId().equals(skipBookingId))
                        .collect(Collectors.toList());
            }
            if (!nearbyBookings.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "A buffer time of " + room.getBufferTimeMinutes()
                                + " minutes is required between bookings for this room.");
            }
        }
    }

    private void checkConflicts(Room room, LocalDateTime start, LocalDateTime end, Long slotId, Long skipBookingId) {
        List<MaintenanceBlock> maints = maintenanceBlockRepository
                .findByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(room.getId(), end, start);
        if (!maints.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is under maintenance.");
        }

        if (room.getResourceType() == ResourceType.PARKING || room.getResourceType() == ResourceType.SHUTTLE) {
            if (slotId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A slot must be selected.");
            }
            List<Booking> conflicts = bookingRepository
                    .findBySlotIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                            slotId, Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), end, start);
            if (skipBookingId != null) {
                conflicts = conflicts.stream().filter(b -> !b.getId().equals(skipBookingId))
                        .collect(Collectors.toList());
            }
            if (!conflicts.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This slot is already booked.");
            }
        } else {
            List<Booking> conflicts = bookingRepository
                    .findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                            room.getId(), Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), end, start);
            if (skipBookingId != null) {
                conflicts = conflicts.stream().filter(b -> !b.getId().equals(skipBookingId))
                        .collect(Collectors.toList());
            }
            if (!conflicts.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room is already reserved.");
            }
        }
    }

    private void createAudit(Booking booking, String action, User user, String note) {
        BookingAudit audit = new BookingAudit();
        audit.setBooking(booking);
        audit.setAction(action);
        audit.setUser(user);
        audit.setNote(note);
        auditRepository.save(audit);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public BookingOut mapToOut(Booking booking) {
        BookingOut out = new BookingOut();
        out.setId(booking.getId());
        out.setUserId(booking.getUser() != null ? booking.getUser().getId() : null);
        out.setRoomId(booking.getRoom() != null ? booking.getRoom().getId() : null);
        out.setSlotId(booking.getSlot() != null ? booking.getSlot().getId() : null);
        out.setRoutedToId(booking.getRoutedTo() != null ? booking.getRoutedTo().getId() : null);
        out.setStartTime(booking.getStartTime());
        out.setEndTime(booking.getEndTime());
        out.setPurpose(booking.getPurpose());
        out.setStatus(booking.getStatus());
        out.setManagerComment(booking.getManagerComment());
        out.setRequestedAt(booking.getRequestedAt());
        out.setApprovedById(booking.getApprovedBy() != null ? booking.getApprovedBy().getId() : null);
        out.setApprovedAt(booking.getApprovedAt());
        out.setRequestId(booking.getRequestId());

        if (booking.getUser() != null) {
            out.setUser(userService.mapToOut(booking.getUser()));
        }

        if (booking.getRoom() != null) {
            out.setRoom(roomService.mapToOut(booking.getRoom()));
        }

        if (booking.getApprovedBy() != null) {
            out.setApprovedBy(userService.mapToOut(booking.getApprovedBy()));
        }

        if (booking.getRoutedTo() != null) {
            out.setRoutedTo(userService.mapToOut(booking.getRoutedTo()));
        }

        return out;
    }
}
