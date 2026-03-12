package com.codecollab.service;

import com.codecollab.entity.User;
import com.codecollab.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Returns an existing user with the given username, or creates a new one.
     */
    public User createOrGetUser(String username, String color) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = new User(username, color != null ? color : "");
            return userRepository.save(user);
        });
    }

    @Cacheable(value = "users", key = "#id")
    public Optional<User> getUser(String id) {
        return userRepository.findById(id);
    }

    @CacheEvict(value = "users", key = "#id")
    public void evictUserCache(String id) {}
}
