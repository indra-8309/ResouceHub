package com.engage.resourcebooking.repository;

import com.engage.resourcebooking.model.ResourceSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceSlotRepository extends JpaRepository<ResourceSlot, Long> {
    List<ResourceSlot> findByResourceId(Long resourceId);
    List<ResourceSlot> findByResourceIdAndIsActiveTrue(Long resourceId);
}
