package com.engage.resourcebooking.config;

import com.engage.resourcebooking.model.*;
import com.engage.resourcebooking.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoomRepository roomRepository;
    @Autowired
    private ResourceSlotRepository slotRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private BookingAuditRepository auditRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Check if db is already seeded
            if (departmentRepository.count() > 0) {
                System.out.println("Database already seeded. Ensuring some rooms are inactive...");
                roomRepository.findAll().forEach(r -> {
                    if (r.getName().equals("Mourya") || r.getName().equals("Sahyadri")) {
                        r.setActive(false);
                        roomRepository.save(r);
                    }
                });
                return;
            }

            System.out.println("Starting enterprise database seeding...");

            // 0. Create Departments
            List<String> deptNames = List.of(
                    "DT (Digital Transformation)", "Data and AI", "AI First Lab",
                    "Planning", "Salesforce", "Hr", "Marketing", "Finance", "Academy Head");
            Map<String, Department> deptMap = new HashMap<>();
            for (String name : deptNames) {
                Department d = new Department();
                d.setName(name);
                departmentRepository.save(d);
                deptMap.put(name, d);
            }

            // 1. Create Users
            User admin = new User();
            admin.setEmail("admin@gmail.com");
            admin.setFullName("Enterprise Admin");
            admin.setHashedPassword(passwordEncoder.encode("123456"));
            admin.setRole(UserRole.ADMIN);
            admin.setDepartment(deptMap.get("DT (Digital Transformation)"));
            admin.setApproved(true);
            userRepository.save(admin);

            User manager = new User();
            manager.setEmail("manager@gmail.com");
            manager.setFullName("Tech Manager");
            manager.setHashedPassword(passwordEncoder.encode("123456"));
            manager.setRole(UserRole.MANAGER);
            manager.setDepartment(deptMap.get("Data and AI"));
            manager.setApproved(true);
            userRepository.save(manager);

            User empWithMgr = new User();
            empWithMgr.setEmail("employee1@gmail.com");
            empWithMgr.setFullName("Standard Employee");
            empWithMgr.setHashedPassword(passwordEncoder.encode("123456"));
            empWithMgr.setRole(UserRole.EMPLOYEE);
            empWithMgr.setDepartment(deptMap.get("Data and AI"));
            empWithMgr.setManager(manager);
            empWithMgr.setApproved(true);
            userRepository.save(empWithMgr);

            User empNoMgr = new User();
            empNoMgr.setEmail("employee2@gmail.com");
            empNoMgr.setFullName("Independent Employee");
            empNoMgr.setHashedPassword(passwordEncoder.encode("123456"));
            empNoMgr.setRole(UserRole.EMPLOYEE);
            empNoMgr.setDepartment(deptMap.get("Salesforce"));
            empNoMgr.setApproved(true);
            userRepository.save(empNoMgr);

            // 4. Create Rooms
            List<Room> rooms = new ArrayList<>();
            Object[][] roomsData = {
                    { "Nalanda", 12, "[\"LED Screen\", \"WiFi\", \"AC\"]", true },
                    { "Mantra", 8, "[\"Whiteboard\", \"WiFi\", \"AC\"]", false },
                    { "Hoysala", 15, "[\"Projector\", \"WiFi\", \"Video Conferencing\"]", true },
                    { "Vijayanagara", 25, "[\"Auditorium Setup\", \"Sound System\", \"WiFi\"]", true },
                    { "Kadamba", 10, "[\"WiFi\", \"Privacy Glass\", \"AC\"]", false },
                    { "Kaveri", 6, "[\"Circular Table\", \"WiFi\", \"AC\"]", false },
                    { "Ganga", 20, "[\"Large Display\", \"WiFi\", \"AC\", \"Coffee Station\"]", true },
                    { "Mourya", 30, "[\"Premium Seating\", \"4K Video Conferencing\", \"WiFi\"]", true },
                    { "Boardroom", 18, "[\"Executive Seating\", \"Touch Panel\", \"WiFi\"]", true },
                    { "Huddle Room", 4, "[\"Whiteboard\", \"WiFi\"]", false },
                    { "Focus Pod", 1, "[\"Sound Proofing\", \"WiFi\", \"Ergonomic Chair\"]", false },
                    { "Moksha", 12, "[\"Zen Lighting\", \"WiFi\", \"AC\"]", false },
                    { "Maitri", 8, "[\"Collaboration Wall\", \"WiFi\", \"AC\"]", false },
                    { "Sahyadri", 22, "[\"Dual Screens\", \"WiFi\", \"AC\"]", true },
                    { "Indus", 14, "[\"Glass Board\", \"WiFi\", \"AC\"]", false },
                    { "Wadeyars", 20, "[\"Heritage Decor\", \"WiFi\", \"AC\"]", true },
                    { "Wellness Room", 1, "[\"Recliner\", \"Zen Music\", \"Essential Oils\", \"Sound Proofing\"]",
                            false }
            };

            for (Object[] data : roomsData) {
                Room r = new Room();
                r.setName((String) data[0]);
                r.setCapacity((Integer) data[1]);
                r.setFeatures((String) data[2]);
                r.setNeedsApproval((Boolean) data[3]);
                r.setBookingHours("{\"start\": \"09:00\", \"end\": \"22:00\"}");
                r.setResourceType(ResourceType.ROOM);
                r.setActive(true);
                r.setAllowedDepartments("[]");

                // Make some rooms inactive for demonstration
                if (r.getName().equals("Mourya") || r.getName().equals("Sahyadri")) {
                    r.setActive(false);
                }

                roomRepository.save(r);
                rooms.add(r);
            }

            // 4b. Create Parking
            Object[][] parkingLots = {
                    { "Executive Parking Alpha", 20, "[\"EV Charging\", \"Premium Security\"]" },
                    { "Parking Lot Prime", 20, "[\"CCTV\", \"Covered\", \"Secure\"]" }
            };

            for (Object[] data : parkingLots) {
                Room p = new Room();
                p.setName((String) data[0]);
                p.setCapacity((Integer) data[1]);
                p.setFeatures((String) data[2]);
                p.setBookingHours("{\"start\": \"00:00\", \"end\": \"23:59\"}");
                p.setNeedsApproval(false);
                p.setResourceType(ResourceType.PARKING);
                p.setActive(true);
                roomRepository.save(p);

                for (int i = 1; i <= (Integer) data[1]; i++) {
                    ResourceSlot slot = new ResourceSlot();
                    slot.setResource(p);
                    slot.setSlotNumber("P" + i);
                    slotRepository.save(slot);
                }
            }

            // Create Shuttles
            Object[][] shuttles = {
                    { "Corporate Shuttle 1", 30, "[\"WiFi\", \"AC\", \"USB Ports\"]" },
                    { "Staff Shuttle Beta", 30, "[\"GPS Tracked\", \"AC\"]" }
            };

            for (Object[] data : shuttles) {
                Room s = new Room();
                s.setName((String) data[0]);
                s.setCapacity((Integer) data[1]);
                s.setFeatures((String) data[2]);
                s.setBookingHours("{\"start\": \"06:00\", \"end\": \"23:00\"}");
                s.setNeedsApproval(false);
                s.setResourceType(ResourceType.SHUTTLE);
                s.setActive(true);
                roomRepository.save(s);

                String[] cols = { "A", "B", "C", "D", "E", "F" };
                for (int row = 1; row <= 5; row++) {
                    for (String col : cols) {
                        ResourceSlot slot = new ResourceSlot();
                        slot.setResource(s);
                        slot.setSlotNumber(row + col);
                        slotRepository.save(slot);
                    }
                }
            }

            // 5. Create Sample Bookings
            Booking b1 = new Booking();
            b1.setUser(empWithMgr);
            b1.setRoom(rooms.get(0)); // Boardroom A (needs approval)
            b1.setStartTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0));
            b1.setEndTime(LocalDateTime.now().plusDays(1).withHour(11).withMinute(0));
            b1.setPurpose("Monthly Team Review");
            b1.setStatus(BookingStatus.PENDING);
            b1.setRoutedTo(manager);
            bookingRepository.save(b1);

            Booking b2 = new Booking();
            b2.setUser(empNoMgr);
            b2.setRoom(rooms.get(0));
            b2.setStartTime(LocalDateTime.now().plusDays(2).withHour(14).withMinute(0));
            b2.setEndTime(LocalDateTime.now().plusDays(2).withHour(15).withMinute(0));
            b2.setPurpose("Project Kickoff");
            b2.setStatus(BookingStatus.PENDING);
            b2.setRoutedTo(admin);
            bookingRepository.save(b2);

            BookingAudit a1 = new BookingAudit();
            a1.setBooking(b1);
            a1.setAction("CREATED");
            a1.setUser(empWithMgr);
            a1.setNote("Initial system seed booking");
            auditRepository.save(a1);

            BookingAudit a2 = new BookingAudit();
            a2.setBooking(b2);
            a2.setAction("CREATED");
            a2.setUser(empNoMgr);
            a2.setNote("Initial system seed booking");
            auditRepository.save(a2);

            System.out.println("Database seeded successfully with enterprise scenarios!");

        } catch (Exception e) {
            System.err.println("Error during data seeding: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
