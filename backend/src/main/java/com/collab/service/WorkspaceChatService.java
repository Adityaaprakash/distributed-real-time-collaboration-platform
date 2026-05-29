package com.collab.service;

import com.collab.dto.ChatMessageResponse;
import com.collab.entity.User;
import com.collab.entity.Workspace;
import com.collab.entity.WorkspaceMessage;
import com.collab.exception.ResourceNotFoundException;
import com.collab.exception.UnauthorizedException;
import com.collab.redis.RedisMessagePublisher;
import com.collab.repository.UserRepository;
import com.collab.repository.WorkspaceMemberRepository;
import com.collab.repository.WorkspaceMessageRepository;
import com.collab.repository.WorkspaceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkspaceChatService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMessageRepository messageRepository;
    private final WorkspaceMemberRepository memberRepository;
    private final RedisMessagePublisher redisMessagePublisher;
    private final ObjectMapper objectMapper;

    @Transactional
    public ChatMessageResponse sendMessage(String workspaceId, String content, String senderEmail) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UUID wsId = UUID.fromString(workspaceId);
        
        boolean isMember = memberRepository.existsByIdWorkspaceIdAndIdUserId(wsId, sender.getId());
        if (!isMember) {
            throw new UnauthorizedException("User is not a member of this workspace");
        }
        
        Workspace workspace = workspaceRepository.findById(wsId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));

        WorkspaceMessage message = new WorkspaceMessage();
        message.setWorkspace(workspace);
        message.setSender(sender);
        message.setContent(content);

        WorkspaceMessage savedMessage = messageRepository.save(message);

        ChatMessageResponse response = buildResponse(savedMessage);

        try {
            String json = objectMapper.writeValueAsString(response);
            redisMessagePublisher.publish(workspaceId, json);
        } catch (Exception e) {
            log.error("Failed to serialize or publish chat message", e);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getWorkspaceMessages(String workspaceId, String currentUserEmail) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
                
        UUID wsId = UUID.fromString(workspaceId);

        boolean isMember = memberRepository.existsByIdWorkspaceIdAndIdUserId(wsId, currentUser.getId());
        if (!isMember) {
            throw new UnauthorizedException("User is not a member of this workspace");
        }

        List<WorkspaceMessage> messages = messageRepository.findTop100ByWorkspaceIdOrderByCreatedAtDesc(wsId);
        
        Collections.reverse(messages);

        return messages.stream()
                .map(this::buildResponse)
                .collect(Collectors.toList());
    }

    private ChatMessageResponse buildResponse(WorkspaceMessage msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId().toString())
                .workspaceId(msg.getWorkspace().getId().toString())
                .senderId(msg.getSender().getId().toString())
                .senderEmail(msg.getSender().getEmail())
                .senderFullName(msg.getSender().getFullName())
                .content(msg.getContent())
                .createdAt(msg.getCreatedAt().toString())
                .build();
    }
}
