package com.engage.resourcebooking.service;

import com.engage.resourcebooking.dto.RoomCreate;
import com.engage.resourcebooking.dto.RoomOut;
import com.engage.resourcebooking.model.*;
import com.engage.resourcebooking.repository.BookingRepository;
import com.engage.resourcebooking.repository.MaintenanceBlockRepository;
import com.engage.resourcebooking.repository.RoomRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private MaintenanceBlockRepository maintenanceBlockRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public RoomOut mapToOut(Room room) {
        RoomOut out = new RoomOut();
        out.setId(room.getId());
        out.setName(room.getName());
        out.setCapacity(room.getCapacity());
        out.setResourceType(room.getResourceType());
        out.setActive(room.isActive());
        out.setNeedsApproval(room.isNeedsApproval());
        out.setBookingHours(room.getBookingHours());
        out.setMaxDurationHours(room.getMaxDurationHours());
        out.setBufferTimeMinutes(room.getBufferTimeMinutes());
        out.setFloor(room.getFloor());
        out.setBuilding(room.getBuilding());

        try {
            if (room.getFeatures() != null && !room.getFeatures().isEmpty()) {
                out.setFeatures(objectMapper.readValue(room.getFeatures(), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}));
            } else {
                out.setFeatures(java.util.Collections.emptyList());
            }

            if (room.getAllowedRoles() != null && !room.getAllowedRoles().isEmpty()) {
                out.setAllowedRoles(objectMapper.readValue(room.getAllowedRoles(), new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}));
            } else {
                out.setAllowedRoles(java.util.Collections.emptyList());
            }

            if (room.getAllowedDepartments() != null && !room.getAllowedDepartments().isEmpty()) {
                out.setAllowedDepartments(objectMapper.readValue(room.getAllowedDepartments(), new com.fasterxml.jackson.core.type.TypeReference<List<Long>>() {}));
            } else {
                out.setAllowedDepartments(java.util.Collections.emptyList());
            }
        } catch (Exception e) {
            out.setFeatures(java.util.Collections.emptyList());
            out.setAllowedRoles(java.util.Collections.emptyList());
            out.setAllowedDepartments(java.util.Collections.emptyList());
        }

        return out;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<RoomOut> getRooms(User currentUser, Integer capacity, List<String> features, Long roomId, String name) {
        List<Room> rooms;
        if ("admin".equalsIgnoreCase(currentUser.getRole().name())) {
            rooms = roomRepository.findAll();
        } else {
            rooms = roomRepository.findByIsActiveTrue();
            // Filter by department visibility
            rooms = rooms.stream().filter(r -> {
                if (r.getAllowedDepartments() == null || r.getAllowedDepartments().isEmpty() || r.getAllowedDepartments().equals("[]")) {
                    return true;
                }
                if (currentUser.getDepartment() == null) return false;
                return r.getAllowedDepartments().contains(currentUser.getDepartment().getId().toString());
            }).collect(java.util.stream.Collectors.toList());
        }

        if (roomId != null) rooms = rooms.stream().filter(r -> r.getId().equals(roomId)).collect(java.util.stream.Collectors.toList());
        if (name != null) rooms = rooms.stream().filter(r -> r.getName().toLowerCase().contains(name.toLowerCase())).collect(java.util.stream.Collectors.toList());
        if (capacity != null) rooms = rooms.stream().filter(r -> r.getCapacity() >= capacity).collect(java.util.stream.Collectors.toList());
        if (features != null && !features.isEmpty()) {
            rooms = rooms.stream().filter(r -> {
                if (r.getFeatures() == null) return false;
                for (String f : features) {
                    if (!r.getFeatures().contains(f)) return false;
                }
                return true;
            }).collect(java.util.stream.Collectors.toList());
        }

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        List<RoomOut> result = new java.util.ArrayList<>();

        for (Room room : rooms) {
            RoomOut out = mapToOut(room);
            List<MaintenanceBlock> maints = maintenanceBlockRepository.findByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(room.getId(), now, now);
            if (!maints.isEmpty()) {
                out.setStatus("maintenance");
            } else {
                if (room.getResourceType() == ResourceType.PARKING || room.getResourceType() == ResourceType.SHUTTLE) {
                    long bookedCount = bookingRepository.findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                            room.getId(), java.util.Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), now, now).size();
                    out.setStatus(bookedCount >= room.getCapacity() ? "occupied" : "available");
                    out.setStatusDetail(out.getStatus().equals("available") ? (room.getCapacity() - bookedCount) + " slots left" : "Full");
                } else {
                    List<Booking> activeBookings = bookingRepository.findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                            room.getId(), java.util.Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), now, now);
                    out.setStatus(activeBookings.isEmpty() ? "available" : "occupied");
                }
            }
            result.add(out);
        }
        return result;
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<RoomOut> searchRooms(User currentUser, java.time.LocalDateTime startTime, java.time.LocalDateTime endTime, Integer capacity, List<String> features, Long roomId) {
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please select a valid booking time. Past time slots are not allowed.");
        }
        if (!endTime.isAfter(startTime)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
        }

        List<Room> rooms = roomRepository.findAll();
        
        // We no longer filter out rooms based on department. 
        // We will mark them as restricted later in the mapping loop.
        if (roomId != null) rooms = rooms.stream().filter(r -> r.getId().equals(roomId)).collect(Collectors.toList());
        
        // Filter by booking hours if they exist
        rooms = rooms.stream().filter(r -> {
                if (!r.isActive()) return true;
                if (r.getBookingHours() == null || r.getBookingHours().isEmpty()) return true;
                try {
                    String bh = r.getBookingHours();
                    String startStr = bh.replaceAll(".*\"start\"\\s*:\\s*\"([^\"]+)\".*", "$1");
                    String endStr   = bh.replaceAll(".*\"end\"\\s*:\\s*\"([^\"]+)\".*", "$1");
                    java.time.LocalTime allowedStart = java.time.LocalTime.parse(startStr);
                    java.time.LocalTime allowedEnd   = java.time.LocalTime.parse(endStr);
                    java.time.LocalTime searchStart  = startTime.toLocalTime();
                    java.time.LocalTime searchEnd    = endTime.toLocalTime();
                    return !searchStart.isBefore(allowedStart) && !searchEnd.isAfter(allowedEnd);
                } catch (Exception e) {
                    return true;
                }
        }).collect(Collectors.toList());
        
        // Filter by maximum duration
        long requestedMinutes = java.time.Duration.between(startTime, endTime).toMinutes();
        rooms = rooms.stream().filter(r -> {
            if (!r.isActive()) return true;
            if (r.getMaxDurationHours() == null) return true;
            return requestedMinutes <= r.getMaxDurationHours() * 60;
        }).collect(Collectors.toList());
        if (roomId != null) rooms = rooms.stream().filter(r -> r.getId().equals(roomId)).collect(Collectors.toList());
        // We NO LONGER filter out rooms based on capacity, features, or hours.
        // We will mark them as unavailable in the loop below.

        List<RoomOut> result = new ArrayList<>();
        for (Room room : rooms) {
            RoomOut out = mapToOut(room);
        List<MaintenanceBlock> maints = maintenanceBlockRepository.findByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(room.getId(), endTime, startTime);
        if (!room.isActive()) {
            out.setStatus("inactive");
            out.setReason("This room is currently inactive");
        } else if (!"admin".equalsIgnoreCase(currentUser.getRole().name()) && room.getAllowedRoles() != null && !room.getAllowedRoles().isEmpty() && !room.getAllowedRoles().toLowerCase().contains(currentUser.getRole().name().toLowerCase())) {
            out.setStatus("restricted");
            out.setReason("Role Restricted");
        } else if (!"admin".equalsIgnoreCase(currentUser.getRole().name()) && !out.getAllowedDepartments().isEmpty()) {
            if (currentUser.getDepartment() == null || !out.getAllowedDepartments().contains(currentUser.getDepartment().getId())) {
                out.setStatus("restricted");
                out.setReason("Department Restricted");
            }
        }
        
        // Capacity check
        if (out.getStatus() == null && capacity != null && room.getCapacity() < capacity) {
            out.setStatus("occupied");
            out.setReason("Insufficient Capacity (" + room.getCapacity() + " seats)");
        }

        // Features check
        if (out.getStatus() == null && features != null && !features.isEmpty()) {
            if (room.getFeatures() == null) {
                out.setStatus("occupied");
                out.setReason("Missing required features");
            } else {
                for (String f : features) {
                    if (!room.getFeatures().contains(f)) {
                        out.setStatus("occupied");
                        out.setReason("Missing: " + f);
                        break;
                    }
                }
            }
        }

        // Hours check
        if (out.getStatus() == null && room.getBookingHours() != null && !room.getBookingHours().isEmpty()) {
            try {
                String bh = room.getBookingHours();
                String startStr = bh.replaceAll(".*\"start\"\\s*:\\s*\"([^\"]+)\".*", "$1");
                String endStr   = bh.replaceAll(".*\"end\"\\s*:\\s*\"([^\"]+)\".*", "$1");
                java.time.LocalTime allowedStart = java.time.LocalTime.parse(startStr);
                java.time.LocalTime allowedEnd   = java.time.LocalTime.parse(endStr);
                if (startTime.toLocalTime().isBefore(allowedStart) || endTime.toLocalTime().isAfter(allowedEnd)) {
                    out.setStatus("occupied");
                    out.setReason("Outside allowed hours (" + startStr + "-" + endStr + ")");
                }
            } catch (Exception e) {}
        }
        
        if (out.getStatus() == null && !maints.isEmpty()) {
            out.setStatus("maintenance");
            out.setReason("Maintenance: " + maints.get(0).getReason());
        } else if (out.getStatus() == null) {
                int buffer = room.getBufferTimeMinutes() != null ? room.getBufferTimeMinutes() : 0;
                LocalDateTime bufferedStart = startTime.minusMinutes(buffer);
                LocalDateTime bufferedEnd = endTime.plusMinutes(buffer);
                
                if (room.getResourceType() == ResourceType.PARKING || room.getResourceType() == ResourceType.SHUTTLE) {
                    long bookedCount = bookingRepository.findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                            room.getId(), Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), bufferedEnd, bufferedStart).stream()
                            .filter(b -> b.getSlot() != null)
                            .map(b -> b.getSlot().getId()).distinct().count();
                    
                    if (bookedCount >= room.getCapacity()) {
                        out.setStatus("occupied");
                    } else {
                        out.setStatus("available");
                        out.setStatusDetail((room.getCapacity() - bookedCount) + " slots left");
                    }
                } else {
                    List<Booking> conflicts = bookingRepository.findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
                            room.getId(), Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED), bufferedEnd, bufferedStart);
                    out.setStatus(conflicts.isEmpty() ? "available" : "occupied");
                }
            }
            result.add(out);
        }
        return result;
    }

    public RoomOut createRoom(RoomCreate roomCreate) {
        Room room = new Room();
        mapToEntity(roomCreate, room);
        roomRepository.save(room);
        return mapToOut(room);
    }

    public RoomOut updateRoom(Long roomId, RoomCreate roomCreate) {
        Room room = roomRepository.findById(roomId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        mapToEntity(roomCreate, room);
        roomRepository.save(room);
        return mapToOut(room);
    }

    private void mapToEntity(RoomCreate in, Room room) {
        room.setName(in.getName());
        room.setCapacity(in.getCapacity());
        room.setResourceType(in.getResourceType() != null ? in.getResourceType() : ResourceType.ROOM);
        
        try {
            if (in.getFeatures() != null) {
                room.setFeatures(objectMapper.writeValueAsString(in.getFeatures()));
            }
            if (in.getAllowedRoles() != null) {
                room.setAllowedRoles(objectMapper.writeValueAsString(in.getAllowedRoles()));
            }
            if (in.getAllowedDepartments() != null) {
                room.setAllowedDepartments(objectMapper.writeValueAsString(in.getAllowedDepartments()));
            }
        } catch (Exception e) {
            // Log error
        }

        room.setActive(in.isActive());
        room.setNeedsApproval(in.isNeedsApproval());
        room.setBookingHours(in.getBookingHours());
        room.setMaxDurationHours(in.getMaxDurationHours());
        room.setBufferTimeMinutes(in.getBufferTimeMinutes());
        room.setFloor(in.getFloor());
        room.setBuilding(in.getBuilding());
    }
}
