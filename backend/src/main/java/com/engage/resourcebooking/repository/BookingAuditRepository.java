package com.engage.resourcebooking.repository;

import com.engage.resourcebooking.model.BookingAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingAuditRepository extends JpaRepository<BookingAudit, Long> {
    List<BookingAudit> findByBookingIdOrderByTimestampAsc(Long bookingId);
}
