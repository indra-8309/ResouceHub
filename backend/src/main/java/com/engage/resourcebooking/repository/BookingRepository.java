package com.engage.resourcebooking.repository;

import com.engage.resourcebooking.model.Booking;
import com.engage.resourcebooking.model.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByRequestedAtDescIdDesc(Long userId);
    List<Booking> findByRoomIdOrderByRequestedAtDesc(Long roomId);
    List<Booking> findByStatusAndEndTimeBefore(BookingStatus status, LocalDateTime time);
    
    // For conflict checking
    List<Booking> findByRoomIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long roomId, List<BookingStatus> statuses, LocalDateTime endTime, LocalDateTime startTime);
            
    List<Booking> findBySlotIdAndStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Long slotId, List<BookingStatus> statuses, LocalDateTime endTime, LocalDateTime startTime);

    List<Booking> findByRoutedToIdOrderByRequestedAtDescIdDesc(Long routedToId);
    
    @Query("SELECT b.room.name, COUNT(b) FROM Booking b GROUP BY b.room.name ORDER BY COUNT(b) DESC")
    List<Object[]> countByRoom();
    
    List<Booking> findByRequestId(String requestId);
}
