package com.engage.resourcebooking.repository;

import com.engage.resourcebooking.model.MaintenanceBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MaintenanceBlockRepository extends JpaRepository<MaintenanceBlock, Long> {
    List<MaintenanceBlock> findByRoomIdAndStartTimeLessThanAndEndTimeGreaterThan(
            Long roomId, LocalDateTime endTime, LocalDateTime startTime);

    List<MaintenanceBlock> findByRoomId(Long roomId);
}
