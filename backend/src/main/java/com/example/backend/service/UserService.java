package com.example.backend.service;

import com.example.backend.entity.ERole;
import com.example.backend.entity.User;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void requireAdmin(HttpServletRequest request) {
        User currentUser = (User) request.getAttribute("currentUser");
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        if (currentUser.getRole() != ERole.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found for ID: " + userId));
    }

    public User addNewUser(User user) {
        return userRepository.save(user);
    }

    public User updateUser(Long userId, User updatedUser) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found for ID: " + userId));
        existingUser.setUsername(updatedUser.getUsername());
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isBlank()) {
            existingUser.setPassword(updatedUser.getPassword());
        }
        if (updatedUser.getBadgeNumber() != null) {
            existingUser.setBadgeNumber(updatedUser.getBadgeNumber().isBlank() ? null : updatedUser.getBadgeNumber());
        }
        return userRepository.save(existingUser);
    }

    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}