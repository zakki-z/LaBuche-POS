package com.example.backend.service.impl;

import com.example.backend.DAO.OrderDAO;
import com.example.backend.DAO.UserDAO;
import com.example.backend.DTOMapper.OrderDTOMapper;
import com.example.backend.dto.OrderDTO;
import com.example.backend.dto.UserDTO;
import com.example.backend.entity.Order;
import com.example.backend.entity.User;
import com.example.backend.exception.OrderNotFoundException;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.validator.UserValidator;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl {
    private final OrderDAO orderDAO;
    private final OrderDTOMapper orderDTOMapper;
    private final UserDTO userDTO;
    private final UserValidator userValidator;
    private final UserDAO userDAO;

    public OrderServiceImpl(OrderDAO orderDAO, OrderDTOMapper orderDTOMapper, UserDTO userDTO, UserValidator userValidator, UserDAO userDAO){
        this.orderDAO=orderDAO;
        this.orderDTOMapper=orderDTOMapper;
        this.userDTO=userDTO;
        this.userValidator=userValidator;
        this.userDAO = userDAO;
    }
    //TODO:Not sure if it works yet but even tho clean up
    public OrderDTO createOrder(OrderDTO orderDTO){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        userValidator.ValidateUserExists(userDTO.username());
        User user = userDAO.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        // Map DTO to Entity and set the user
        Order order = orderDTOMapper.toEntity(orderDTO);
        order.setUser(user);

        return orderDTOMapper.toDto(orderDAO.save(order));
    }
    public List<OrderDTO> getAllOrders(){
        return orderDAO.findAll().stream()
                .map(orderDTOMapper::toDto)
                .collect(Collectors.toList());
    }
    public Optional<OrderDTO> getOrderById(Long id){
        var order = orderDAO.findById(id)
                .orElseThrow(()->new OrderNotFoundException("Order not found"));
        return orderDTOMapper.toDto(order);
    }
    public OrderDTO updateOrder(Long id, OrderDTO orderDTO){
        Order existingOrder = orderDAO.findById(id)
                .orElseThrow(()->new OrderNotFoundException("cannot find order with id"+id));
        orderDTOMapper.updateEntityFromDto(orderDTO, existingOrder);
        Order updatedOrder = orderDAO.save(existingOrder);
        return orderDTOMapper.toDto(updatedOrder);
    }
    public void deleteOrder(long id){
        if (!orderDAO.existsById(id)) {
            throw new OrderNotFoundException("Item not found: " + id);
        }
        orderDAO.deleteById(id);
    }
}
