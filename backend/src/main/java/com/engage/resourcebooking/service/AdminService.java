package com.engage.resourcebooking.service;

import com.engage.resourcebooking.dto.*;
import com.engage.resourcebooking.model.*;
import com.engage.resourcebooking.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private MaintenanceBlockRepository maintenanceBlockRepository;

    @Autowired
    private ResourceSlotRepository resourceSlotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingAuditRepository bookingAuditRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private UserService userService;

    @Autowired
    private BookingService bookingService;

    // ─── Room Management ──────────────────────────────────────────────────

    @Transactional
    public void deleteRoom(Long roomId) {
        roomRepository.deleteById(roomId);
    }

    // ─── Maintenance Block Management ─────────────────────────────────────

    @Transactional
    public MaintenanceBlockOut addMaintenance(Long roomId, MaintenanceBlockCreate req) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        if (!req.getEndTime().isAfter(req.getStartTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }
        MaintenanceBlock block = new MaintenanceBlock();
        block.setRoom(room);
        block.setStartTime(req.getStartTime());
        block.setEndTime(req.getEndTime());
        block.setReason(req.getReason());
        maintenanceBlockRepository.save(block);
        return toMaintenanceOut(block);
    }

    @Transactional(readOnly = true)
    public List<MaintenanceBlockOut> getMaintenance(Long roomId) {
        return maintenanceBlockRepository.findByRoomId(roomId)
                .stream().map(this::toMaintenanceOut).collect(Collectors.toList());
    }

    @Transactional
    public void deleteMaintenance(Long blockId) {
        maintenanceBlockRepository.deleteById(blockId);
    }

    // ─── Resource Slots ───────────────────────────────────────────────────

    @Transactional
    public ResourceSlotOut addSlot(Long roomId, ResourceSlotCreate req) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        ResourceSlot slot = new ResourceSlot();
        slot.setResource(room);
        slot.setSlotNumber(req.getSlotNumber());
        slot.setActive(req.isActive());
        resourceSlotRepository.save(slot);
        ResourceSlotOut out = new ResourceSlotOut();
        out.setId(slot.getId());
        out.setRoomId(roomId);
        out.setSlotNumber(slot.getSlotNumber());
        out.setActive(slot.isActive());
        return out;
    }

    @Transactional(readOnly = true)
    public List<ResourceSlotOut> getSlots(Long roomId) {
        return resourceSlotRepository.findByResourceId(roomId).stream().map(s -> {
            ResourceSlotOut out = new ResourceSlotOut();
            out.setId(s.getId());
            out.setRoomId(roomId);
            out.setSlotNumber(s.getSlotNumber());
            out.setActive(s.isActive());
            return out;
        }).collect(Collectors.toList());
    }

    // ─── User Management ──────────────────────────────────────────────────

    @Transactional
    public UserOut adminCreateUser(UserCreate userCreate) {
        String email = userCreate.getEmail().toLowerCase().trim();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
        }
        User user = new User();
        user.setEmail(email);
        user.setFullName(userCreate.getFullName());
        user.setHashedPassword(encoder.encode(userCreate.getPassword()));
        user.setRole(userCreate.getRole() != null ? userCreate.getRole() : UserRole.EMPLOYEE);
        user.setApproved(true);
        if (userCreate.getDepartmentId() != null) {
            departmentRepository.findById(userCreate.getDepartmentId()).ifPresent(user::setDepartment);
        }
        if (userCreate.getManagerId() != null) {
            userRepository.findById(userCreate.getManagerId()).ifPresent(user::setManager);
        }
        userRepository.save(user);
        return userService.mapToOut(user);
    }

    @Transactional
    public UserOut adminUpdateUser(Long userId, UserCreate userCreate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setFullName(userCreate.getFullName());
        if (userCreate.getRole() != null) user.setRole(userCreate.getRole());
        if (userCreate.getDepartmentId() != null) {
            departmentRepository.findById(userCreate.getDepartmentId()).ifPresent(user::setDepartment);
        }
        if (userCreate.getManagerId() != null) {
            userRepository.findById(userCreate.getManagerId()).ifPresent(user::setManager);
        } else {
            user.setManager(null);
        }
        userRepository.save(user);
        return userService.mapToOut(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // 1. Remove manager references from employees managed by this user
        userRepository.findAll().stream()
                .filter(u -> u.getManager() != null && u.getManager().getId().equals(userId))
                .forEach(u -> { u.setManager(null); userRepository.save(u); });

        // 2. Clear routing/approval references in bookings
        bookingRepository.findAll().stream()
                .filter(b -> (b.getRoutedTo() != null && b.getRoutedTo().getId().equals(userId)) ||
                             (b.getApprovedBy() != null && b.getApprovedBy().getId().equals(userId)))
                .forEach(b -> {
                    if (b.getRoutedTo() != null && b.getRoutedTo().getId().equals(userId)) b.setRoutedTo(null);
                    if (b.getApprovedBy() != null && b.getApprovedBy().getId().equals(userId)) b.setApprovedBy(null);
                    bookingRepository.save(b);
                });

        // 3. Delete bookings created by this user and their associated audits
        List<Booking> userBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getUser() != null && b.getUser().getId().equals(userId))
                .collect(Collectors.toList());

        for (Booking b : userBookings) {
            // Delete audits for these bookings
            bookingAuditRepository.findAll().stream()
                    .filter(audit -> audit.getBooking() != null && audit.getBooking().getId().equals(b.getId()))
                    .forEach(bookingAuditRepository::delete);
            bookingRepository.delete(b);
        }

        // 4. Delete audit records performed by this user
        bookingAuditRepository.findAll().stream()
                .filter(audit -> audit.getUser() != null && audit.getUser().getId().equals(userId))
                .forEach(bookingAuditRepository::delete);

        // 5. Finally delete the user
        userRepository.delete(user);
    }

    // ─── Booking Management ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BookingOut> getAdminBookings(Long roomId) {
        return bookingRepository.findAll().stream()
                .filter(b -> roomId == null || (b.getRoom() != null && b.getRoom().getId().equals(roomId)))
                .map(bookingService::mapToOut)
                .collect(Collectors.toList());
    }

    // ─── Helper ───────────────────────────────────────────────────────────

    private MaintenanceBlockOut toMaintenanceOut(MaintenanceBlock block) {
        MaintenanceBlockOut out = new MaintenanceBlockOut();
        out.setId(block.getId());
        out.setRoomId(block.getRoom() != null ? block.getRoom().getId() : null);
        out.setStartTime(block.getStartTime());
        out.setEndTime(block.getEndTime());
        out.setReason(block.getReason());
        return out;
    }
}
