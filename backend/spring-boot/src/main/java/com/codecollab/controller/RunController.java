package com.codecollab.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import java.util.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:5174", "http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true", allowedHeaders = "*")
public class RunController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${PISTON_API_URL:http://piston:2000/api/v2/execute}")
    private String PISTON_API_URL;

    @PostMapping("/run")
    public ResponseEntity<?> executeCode(@RequestBody Map<String, Object> request) {
        System.out.println("=== Code Execution Request Received ===");
        System.out.println("Request body: " + request);
        
        try {
            // Validate request
            if (!request.containsKey("language") || !request.containsKey("files")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid request",
                    "message", "Language and files are required"
                ));
            }

            // Extract language and content from request
            String language = (String) request.get("language");
            
            // Handle files array with proper type casting
            Object filesObj = request.get("files");
            List<Map<String, String>> files = new ArrayList<>();
            
            if (filesObj instanceof List<?>) {
                List<?> filesList = (List<?>) filesObj;
                for (Object fileObj : filesList) {
                    if (fileObj instanceof Map<?, ?>) {
                        Map<?, ?> fileMap = (Map<?, ?>) fileObj;
                        Map<String, String> stringMap = new HashMap<>();
                        for (Map.Entry<?, ?> entry : fileMap.entrySet()) {
                            if (entry.getKey() instanceof String && entry.getValue() instanceof String) {
                                stringMap.put((String) entry.getKey(), (String) entry.getValue());
                            }
                        }
                        files.add(stringMap);
                    }
                }
            }
            
            if (files.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid request",
                    "message", "Files array is required and cannot be empty"
                ));
            }
            
            // Get the code content from the first file
            Map<String, String> firstFile = files.get(0);
            String code = firstFile.get("content");
            
            if (code == null || code.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Invalid request",
                    "message", "Code content cannot be empty"
                ));
            }
            
            // Prepare request for Piston API
            Map<String, Object> pistonRequest = new HashMap<>();

            // Map frontend language names to Piston language names and versions
            String pistonLanguage = language;
            String version = "*";
            String filename = "script";
            if ("javascript".equals(language)) {
                pistonLanguage = "javascript";
                version = "18.15.0";
                filename = "script.js";
            } else if ("python".equals(language)) {
                pistonLanguage = "python";
                version = "3.10.0";
                filename = "script.py";
            } else if ("typescript".equals(language)) {
                pistonLanguage = "typescript";
                filename = "script.ts";
            } else if ("java".equals(language)) {
                pistonLanguage = "java";
                filename = "Main.java";
            } else if ("cpp".equals(language) || "c++".equals(language)) {
                pistonLanguage = "c++";
                filename = "script.cpp";
            }
            pistonRequest.put("language", pistonLanguage);
            pistonRequest.put("version", version);

            // Create files array in the format Piston expects
            List<Map<String, String>> pistonFiles = new ArrayList<>();
            Map<String, String> fileMap = new HashMap<>();
            
            fileMap.put("name", filename);
            fileMap.put("content", code);
            pistonFiles.add(fileMap);
            
            pistonRequest.put("files", pistonFiles);
            pistonRequest.put("stdin", "");
            pistonRequest.put("args", new String[]{});
            
            System.out.println("Sending to Piston API: " + pistonRequest);
            
            // Set headers for Piston API request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            // Create HTTP entity
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(pistonRequest, headers);
            
            // Make request to Piston API
            ResponseEntity<Map> response = restTemplate.exchange(
                PISTON_API_URL,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            System.out.println("Piston API response status: " + response.getStatusCode());
            System.out.println("Piston API response body: " + response.getBody());
            
            // Return successful response with CORS headers
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.set("Access-Control-Allow-Origin", "http://localhost:3000");
            responseHeaders.set("Access-Control-Allow-Credentials", "true");
            responseHeaders.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
            responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
            
            return new ResponseEntity<>(response.getBody(), responseHeaders, HttpStatus.OK);
            
        } catch (HttpClientErrorException | HttpServerErrorException e) {
            System.err.println("HTTP Error from Piston API: " + e.getStatusCode());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Piston API error");
            errorResponse.put("status", e.getStatusCode().value());
            errorResponse.put("message", e.getMessage());
            
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.set("Access-Control-Allow-Origin", "http://localhost:3000");
            responseHeaders.set("Access-Control-Allow-Credentials", "true");
            
            return new ResponseEntity<>(errorResponse, responseHeaders, e.getStatusCode());
            
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Execution failed");
            errorResponse.put("message", e.getMessage());
            
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.set("Access-Control-Allow-Origin", "http://localhost:3000");
            responseHeaders.set("Access-Control-Allow-Credentials", "true");
            
            return new ResponseEntity<>(errorResponse, responseHeaders, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "ok");
        response.put("message", "RunController is working");
        response.put("timestamp", new Date().toString());
        
        HttpHeaders responseHeaders = new HttpHeaders();
        responseHeaders.set("Access-Control-Allow-Origin", "http://localhost:3000");
        responseHeaders.set("Access-Control-Allow-Credentials", "true");
        
        return new ResponseEntity<>(response, responseHeaders, HttpStatus.OK);
    }

    // Handle OPTIONS requests for CORS preflight
    @RequestMapping(value = "/run", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleRunOptions() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
        headers.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        headers.set("Access-Control-Allow-Credentials", "true");
        headers.set("Access-Control-Max-Age", "3600");
        
        return new ResponseEntity<>(headers, HttpStatus.OK);
    }

    @RequestMapping(value = "/test", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleTestOptions() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Access-Control-Allow-Origin", "http://localhost:3000");
        headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
        headers.set("Access-Control-Allow-Headers", "Content-Type");
        headers.set("Access-Control-Allow-Credentials", "true");
        headers.set("Access-Control-Max-Age", "3600");
        
        return new ResponseEntity<>(headers, HttpStatus.OK);
    }
}
