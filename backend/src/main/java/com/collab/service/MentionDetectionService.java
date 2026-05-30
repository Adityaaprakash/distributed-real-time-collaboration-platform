package com.collab.service;

import com.collab.entity.User;
import com.collab.repository.UserRepository;
import com.collab.repository.WorkspaceMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MentionDetectionService {

    private final UserRepository userRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public List<User> detectMentions(String messageContent, UUID workspaceId) {
        List<User> mentionedUsers = new ArrayList<>();
        if (messageContent == null || messageContent.isEmpty()) {
            return mentionedUsers;
        }

        Pattern pattern = Pattern.compile("@([\\w.]+)");
        Matcher matcher = pattern.matcher(messageContent);

        while (matcher.find()) {
            String token = matcher.group(1);
            Optional<User> userOpt = userRepository.findByEmail(token);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByFullNameIgnoreCase(token);
            }

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                boolean isMember = workspaceMemberRepository.findByIdWorkspaceIdAndIdUserId(workspaceId, user.getId()).isPresent();
                if (isMember && !mentionedUsers.contains(user)) {
                    mentionedUsers.add(user);
                }
            }
        }

        return mentionedUsers;
    }
}
