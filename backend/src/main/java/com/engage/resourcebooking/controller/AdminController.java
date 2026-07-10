package com.engage.resourcebooking.controller;

import com.engage.resourcebooking.dto.*;
import com.engage.resourcebooking.service.AdminService;
import com.engage.resourcebooking.service.RoomService;
import com.engage.resourcebooking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private RoomService roomService;

    @Autowired
    private UserService userService;

    // ─── Room Management ──────────────────────────────────────────────────

    @PostMapping("/rooms")
    public RoomOut createRoom(@RequestBody RoomCreate roomCreate) {
        return roomService.createRoom(roomCreate);
    }

    @PutMapping("/rooms/{roomId}")
    public RoomOut updateRoom(@PathVariable Long roomId, @RequestBody RoomCreate roomCreate) {
        return roomService.updateRoom(roomId, roomCreate);
    }

    @DeleteMapping("/rooms/{roomId}")
    public void deleteRoom(@PathVariable Long roomId) {
        adminService.deleteRoom(roomId);
    }

    // ─── Maintenance Block Management ─────────────────────────────────────

    @PostMapping("/rooms/{roomId}/maintenance")
    public MaintenanceBlockOut addMaintenance(@PathVariable Long roomId,
                                               @RequestBody MaintenanceBlockCreate req) {
        return adminService.addMaintenance(roomId, req);
    }

    @GetMapping("/rooms/{roomId}/maintenance")
    public List<MaintenanceBlockOut> getMaintenance(@PathVariable Long roomId) {
        return adminService.getMaintenance(roomId);
    }

    @DeleteMapping("/maintenance/{blockId}")
    public void deleteMaintenance(@PathVariable Long blockId) {
        adminService.deleteMaintenance(blockId);
    }

    // ─── Resource Slots ───────────────────────────────────────────────────

    @PostMapping("/rooms/{roomId}/slots")
    public ResourceSlotOut addSlot(@PathVariable Long roomId, @RequestBody ResourceSlotCreate req) {
        return adminService.addSlot(roomId, req);
    }

    @GetMapping("/rooms/{roomId}/slots")
    public List<ResourceSlotOut> getSlots(@PathVariable Long roomId) {
        return adminService.getSlots(roomId);
    }

    // ─── Statistics ───────────────────────────────────────────────────────

    @GetMapping("/stats")
    public DashboardStats getAdminStats() {
        return userService.getAdminStats();
    }

    // ─── User Management ──────────────────────────────────────────────────

    @GetMapping("/users")
    public List<UserOut> getUsers() {
        return userService.getAllUsers();
    }

    @GetMapping("/requests")
    public List<UserOut> getPendingUsers() {
        return userService.getPendingUsers();
    }

    @PutMapping("/users/{userId}/approve")
    public UserOut approveUser(@PathVariable Long userId) {
        return userService.approveUser(userId);
    }

    @DeleteMapping("/users/{userId}/reject")
    public void rejectUser(@PathVariable Long userId) {
        userService.rejectUser(userId);
    }

    @PostMapping("/users")
    public UserOut adminCreateUser(@RequestBody UserCreate userCreate) {
        return adminService.adminCreateUser(userCreate);
    }

    @PutMapping("/users/{userId}")
    public UserOut adminUpdateUser(@PathVariable Long userId, @RequestBody UserCreate userCreate) {
        return adminService.adminUpdateUser(userId, userCreate);
    }

    @DeleteMapping("/users/{userId}")
    public void deleteUser(@PathVariable Long userId) {
        adminService.deleteUser(userId);
    }

    // ─── Booking Management ───────────────────────────────────────────────

    @GetMapping("/bookings")
    public List<BookingOut> getAdminBookings(@RequestParam(required = false) Long roomId) {
        return adminService.getAdminBookings(roomId);
    }
}

