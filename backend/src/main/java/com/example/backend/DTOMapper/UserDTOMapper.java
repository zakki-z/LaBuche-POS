package com.example.backend.DTOMapper;

import com.example.backend.dto.UserDTO;
import com.example.backend.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserDTOMapper {
    User toEntity(UserDTO dto);
    UserDTO toDto(User user);
}
