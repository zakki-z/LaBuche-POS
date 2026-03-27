package com.example.backend.controller;

import com.example.backend.entity.User;
import com.example.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    public UserController(UserService userService) {
        this.userService = userService;
    }
    @GetMapping
    public Iterable<User> getAllUsers() {
        return userService.getAllUsers();
    }
    @GetMapping("/{userId}")
    public User getUserById(@PathVariable Long userId) {
        return userService.getUserById(userId);
    }
    @PostMapping
    public User addNewUser(@RequestBody User user) {
        return userService.addNewUser(user);
    }
    @PutMapping("/{userId}")
    public User updateUser(@PathVariable Long userId,@Valid @RequestBody User updatedUser) {
        return userService.updateUser(userId, updatedUser);
    }
    @DeleteMapping("/{userId}")
    public void deleteUser(@PathVariable Long userId) {
        userService.deleteUser(userId);
    }
}