package com.codecollab.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CodeEditorHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> userNames = new ConcurrentHashMap<>();
    private final Map<String, String> userColors = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private int userCounter = 0;
    
    // Predefined colors for users
    private final String[] colors = {
        "#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#ffcc5c",
        "#ff6f69", "#88d8b0", "#b5e7a0", "#d4a5a5", "#9b59b6"
    };

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        sessions.put(sessionId, session);
        
        // Generate username and color
        userCounter++;
        String userName = "User " + userCounter;
        String userColor = colors[(userCounter - 1) % colors.length];
        
        userNames.put(sessionId, userName);
        userColors.put(sessionId, userColor);
        
        // Send welcome message to the new user
        Map<String, Object> welcomeMessage = new HashMap<>();
        welcomeMessage.put("type", "welcome");
        welcomeMessage.put("userId", sessionId);
        welcomeMessage.put("username", userName);
        welcomeMessage.put("color", userColor);
        
        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(welcomeMessage)));
        
        // Notify all users about new user
        broadcastUserList();
        
        System.out.println("New connection established: " + sessionId + " as " + userName + " with color " + userColor);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        @SuppressWarnings("unchecked")
        Map<String, Object> data = objectMapper.readValue(payload, Map.class);
        
        String type = (String) data.get("type");
        String sessionId = session.getId();
        
        switch (type) {
            case "code-change":
                // Broadcast code changes to all other users
                for (WebSocketSession s : sessions.values()) {
                    if (!s.getId().equals(sessionId) && s.isOpen()) {
                        s.sendMessage(new TextMessage(payload));
                    }
                }
                break;
                
            case "cursor-update":
                // Add user info to cursor data
                data.put("username", userNames.get(sessionId));
                data.put("color", userColors.get(sessionId));
                data.put("userId", sessionId);
                String cursorMessage = objectMapper.writeValueAsString(data);
                
                // Broadcast cursor to all other users
                for (WebSocketSession s : sessions.values()) {
                    if (!s.getId().equals(sessionId) && s.isOpen()) {
                        s.sendMessage(new TextMessage(cursorMessage));
                    }
                }
                break;
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        sessions.remove(sessionId);
        String userName = userNames.remove(sessionId);
        userColors.remove(sessionId);
        
        // Notify all users about user leaving
        broadcastUserList();
        
        System.out.println("Connection closed: " + sessionId + " (" + userName + ")");
    }

    private void broadcastUserList() throws Exception {
        List<Map<String, String>> userList = new ArrayList<>();
        
        for (Map.Entry<String, String> entry : userNames.entrySet()) {
            Map<String, String> userInfo = new HashMap<>();
            userInfo.put("id", entry.getKey());
            userInfo.put("name", entry.getValue());
            userInfo.put("color", userColors.get(entry.getKey()));
            userList.add(userInfo);
        }
        
        Map<String, Object> message = new HashMap<>();
        message.put("type", "user-list");
        message.put("users", userList);
        
        String userListMessage = objectMapper.writeValueAsString(message);
        
        for (WebSocketSession session : sessions.values()) {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(userListMessage));
            }
        }
    }
}
