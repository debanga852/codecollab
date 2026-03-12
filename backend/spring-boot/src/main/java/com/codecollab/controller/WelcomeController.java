package com.codecollab.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin; 
import java.util.Map;   // 👈 IMPORTANT import

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class WelcomeController {

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome OK";
    }

    @GetMapping("/health")
    public String health() {
        return "Backend is healthy 💪";
    }

    @GetMapping("/info")
    public Map<String, String> info() {
        return Map.of(
                "app", "CodeCollab Backend",
                "status", "running"
        );
    }
}
