package com.example.backend.DTOMapper;

import com.example.backend.dto.OrderDTO;
import com.example.backend.entity.Order;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface OrderDTOMapper {
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "orderLines", ignore = true)
    Order toEntity(OrderDTO dto);

    @Mapping(source = "user.username", target = "username")
    OrderDTO toDto(Order order);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "orderLines", ignore = true)
    void updateEntityFromDto(OrderDTO dto, @MappingTarget Order entity);
}