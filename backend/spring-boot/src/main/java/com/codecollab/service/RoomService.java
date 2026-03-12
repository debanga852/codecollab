package com.codecollab.service;

import com.codecollab.entity.Room;
import com.codecollab.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RoomService {

    @Autowired
    private RoomRepository roomRepository;

    public Room createRoom(String name, String language) {
        String roomId = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        Room room = new Room(roomId, name, language != null ? language : "javascript", "// Start coding here\n");
        return roomRepository.save(room);
    }

    @Cacheable(value = "rooms", key = "#id")
    public Optional<Room> getRoom(String id) {
        return roomRepository.findById(id.toUpperCase());
    }

    public List<Room> getAllRooms() {
        return roomRepository.findAllByOrderByCreatedAtDesc();
    }

    @CacheEvict(value = "rooms", key = "#id")
    public Room updateCode(String id, String code, String language) {
        Room room = roomRepository.findById(id.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Room not found: " + id));
        room.setCode(code);
        if (language != null && !language.isBlank()) {
            room.setLanguage(language);
        }
        return roomRepository.save(room);
    }
}
