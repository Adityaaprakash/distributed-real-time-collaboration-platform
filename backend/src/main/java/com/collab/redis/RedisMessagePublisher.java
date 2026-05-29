package com.collab.redis;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisMessagePublisher {
    
    private final RedisTemplate<String, String> stringRedisTemplate;

    public RedisMessagePublisher(RedisTemplate<String, String> stringRedisTemplate) {
        this.stringRedisTemplate = stringRedisTemplate;
    }

    public void publish(String workspaceId, String jsonMessage) {
        String channel = "workspace.chat." + workspaceId;
        stringRedisTemplate.convertAndSend(channel, jsonMessage);
    }
}
