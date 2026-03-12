package com.codecollab.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String color;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    protected User() {}

    public User(String username, String color) {
        this.username = username;
        this.color = color;
    }

    @PrePersist
    protected void onCreate() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (color == null || color.isBlank()) {
            String[] palette = {"#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffcc5c", "#9b59b6"};
            color = palette[(int) (Math.random() * palette.length)];
        }
    }

    public String getId()           { return id; }
    public String getUsername()     { return username; }
    public void setUsername(String u) { this.username = u; }
    public String getColor()        { return color; }
    public void setColor(String c)  { this.color = c; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
