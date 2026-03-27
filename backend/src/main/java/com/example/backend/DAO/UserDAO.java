package com.example.backend.DAO;

import com.example.backend.entity.User;
import com.example.backend.repository.UserRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class UserDAO {
    private final UserRepository userRepository;
    public UserDAO(UserRepository userRepository){
        this.userRepository=userRepository;
    }
    public List<User> findAll(){
        return userRepository.findAll();
    }
    public Optional<User> findById(Long id){
        return userRepository.findById(id);
    }
    public boolean existsById(Long id){
        return userRepository.existsById(id);
    }
    public Optional<User> findByUsername(String username){
        return userRepository.findByUsername(username);
    }
    public boolean existsByName(String name){
        return userRepository.existsByUsername(name);
    }
    public User save(User user){
        return userRepository.save(user);
    }
    public void deleteById(Long id){
        userRepository.deleteById(id);
    }
}