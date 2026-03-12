package com.codecollab.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final CodeEditorHandler codeEditorHandler;

    @Value("${cors.allowed-origins:http://localhost:5174}")
    private String allowedOriginsRaw;

    public WebSocketConfig(CodeEditorHandler codeEditorHandler) {
        this.codeEditorHandler = codeEditorHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        String[] origins = allowedOriginsRaw.split(",");
        registry.addHandler(codeEditorHandler, "/ws/editor")
                .setAllowedOrigins(origins);
    }
}
