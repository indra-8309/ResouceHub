package com.engage.resourcebooking.service;

import com.engage.resourcebooking.model.Booking;
import com.engage.resourcebooking.model.BookingAudit;
import com.engage.resourcebooking.model.BookingStatus;
import com.engage.resourcebooking.repository.BookingAuditRepository;
import com.engage.resourcebooking.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingScheduler {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingAuditRepository auditRepository;

    // Runs every 5 minutes: auto-complete expired APPROVED bookings
    @Scheduled(fixedRate = 300000)
    public void autoCompleteExpiredBookings() {
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expiredBookings = bookingRepository.findByStatusAndEndTimeBefore(BookingStatus.APPROVED, now);

        for (Booking booking : expiredBookings) {
            booking.setStatus(BookingStatus.COMPLETED);
            bookingRepository.save(booking);

            BookingAudit audit = new BookingAudit();
            audit.setBooking(booking);
            audit.setAction("AUTO_COMPLETED");
            audit.setNote("Booking automatically marked as completed after end time elapsed.");
            auditRepository.save(audit);
        }

        if (!expiredBookings.isEmpty()) {
            System.out.println("[Scheduler] Auto-completed " + expiredBookings.size() + " expired bookings.");
        }
    }
}
