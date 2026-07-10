package com.engage.resourcebooking.service;

import com.engage.resourcebooking.dto.DashboardStats;
import com.engage.resourcebooking.dto.UserOut;
import com.engage.resourcebooking.model.BookingStatus;
import com.engage.resourcebooking.model.Room;
import com.engage.resourcebooking.model.User;
import com.engage.resourcebooking.model.UserRole;
import com.engage.resourcebooking.repository.BookingRepository;
import com.engage.resourcebooking.repository.RoomRepository;
import com.engage.resourcebooking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<UserOut> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(User::isApproved)
                .map(this::mapToOut)
                .collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<UserOut> getPendingUsers() {
        return userRepository.findAll().stream()
                .filter(u -> !u.isApproved())
                .map(this::mapToOut)
                .collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public UserOut approveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setApproved(true);
        userRepository.save(user);
        return mapToOut(user);
    }

    @org.springframework.transaction.annotation.Transactional
    public void rejectUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        userRepository.delete(user);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<UserOut> getManagers() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.MANAGER)
                .map(this::mapToOut)
                .collect(java.util.stream.Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public DashboardStats getAdminStats() {
        long totalRooms = roomRepository.count();
        long activeRooms = roomRepository.findByIsActiveTrue().size();
        
        java.time.LocalDateTime startOfDay = java.time.LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
        
        long pendingRequests = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == com.engage.resourcebooking.model.BookingStatus.PENDING)
                .count();
                
        long approvedToday = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == com.engage.resourcebooking.model.BookingStatus.APPROVED && b.getStartTime().isAfter(startOfDay))
                .count();
                
        long cancelledToday = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == com.engage.resourcebooking.model.BookingStatus.CANCELLED && b.getRequestedAt().isAfter(startOfDay))
                .count();

        DashboardStats stats = new DashboardStats();
        stats.setTotalRooms(totalRooms);
        stats.setActiveRooms(activeRooms);
        stats.setPendingRequests(pendingRequests);
        stats.setApprovedToday(approvedToday);
        stats.setCancelledToday(cancelledToday);
        
        // Calculate most booked room
        List<Object[]> roomCounts = bookingRepository.countByRoom();
        if (!roomCounts.isEmpty()) {
            stats.setMostBookedRoom((String) roomCounts.get(0)[0]);
        } else {
            stats.setMostBookedRoom("None");
        }
        
        // Calculate utilization rate (approved bookings today / total possible slots)
        // For simplicity: (approvedToday * 1.0) / (totalRooms * 8) assuming 8 slots per day
        double rate = totalRooms > 0 ? (approvedToday * 1.0) / (totalRooms * 8.0) : 0.0;
        stats.setUtilizationRate(Math.min(rate, 1.0));

        return stats;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public UserOut mapToOut(User user) {
        UserOut out = new UserOut();
        out.setId(user.getId());
        out.setEmail(user.getEmail());
        out.setFullName(user.getFullName());
        out.setRole(user.getRole());
        out.setApproved(user.isApproved());
        if (user.getDepartment() != null) {
            out.setDepartmentId(user.getDepartment().getId());
            UserOut.DepartmentRef deptRef = new UserOut.DepartmentRef();
            deptRef.setId(user.getDepartment().getId());
            deptRef.setName(user.getDepartment().getName());
            out.setDepartmentName(user.getDepartment().getName());
            out.setDepartment(deptRef);
        }
        if (user.getManager() != null) {
            out.setManagerId(user.getManager().getId());
            UserOut.ManagerRef mgrRef = new UserOut.ManagerRef();
            mgrRef.setId(user.getManager().getId());
            mgrRef.setFullName(user.getManager().getFullName());
            mgrRef.setEmail(user.getManager().getEmail());
            out.setManager(mgrRef);
        }
        return out;
    }
}
