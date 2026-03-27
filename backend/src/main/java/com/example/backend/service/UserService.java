package com.example.backend.service;

import com.example.backend.entity.User;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    public User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found for ID: " + userId));
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    public User addNewUser(User user) {
        return userRepository.save(user);
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    public User updateUser(Long userId, User updatedUser) {
        User existingUser = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found for ID: " + userId));
        existingUser.setUsername(updatedUser.getUsername());
        existingUser.setPassword(updatedUser.getPassword());
        return userRepository.save(existingUser);
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    public void deleteUser(Long userId) {
        userRepository.deleteById(userId);
    }
}