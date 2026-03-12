package com.codecollab.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String language;

    @Column(columnDefinition = "TEXT")
    private String code;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    protected Room() {}

    public Room(String id, String name, String language, String code) {
        this.id = id;
        this.name = name;
        this.language = language;
        this.code = code;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (language == null) language = "javascript";
        if (code == null) code = "// Start coding here\n";
    }

    public String getId()              { return id; }
    public void setId(String id)       { this.id = id; }
    public String getName()            { return name; }
    public void setName(String n)      { this.name = n; }
    public String getLanguage()        { return language; }
    public void setLanguage(String l)  { this.language = l; }
    public String getCode()            { return code; }
    public void setCode(String c)      { this.code = c; }
    public LocalDateTime getCreatedAt(){ return createdAt; }
}
