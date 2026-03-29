package com.example.backend.validator;

import com.example.backend.DAO.UserDAO;
import com.example.backend.exception.UserNotFoundException;
import org.springframework.stereotype.Component;

@Component
public class UserValidator {
    private final UserDAO userDAO;
    public UserValidator(UserDAO userDAO){
        this.userDAO=userDAO;
    }
    public void ValidateUserExists(String name) {
        if(!userDAO.existsByName(name)){
            throw new UserNotFoundException("User not found");
        }
    }
}
