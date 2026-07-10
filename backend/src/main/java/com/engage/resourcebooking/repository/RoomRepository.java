package com.engage.resourcebooking.repository;

import com.engage.resourcebooking.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByIsActiveTrue();
    Optional<Room> findByName(String name);
}
