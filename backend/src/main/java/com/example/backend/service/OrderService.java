package com.example.backend.service;

import com.example.backend.DAO.OrderDAO;
import com.example.backend.DTOMapper.OrderDTOMapper;
import com.example.backend.dto.OrderDTO;
import com.example.backend.entity.Order;
import com.example.backend.entity.User;
import com.example.backend.exception.OrderNotFoundException;
import com.example.backend.exception.UserNotFoundException;
import com.example.backend.repository.OrderRepository;
import com.example.backend.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderDTOMapper orderDTOMapper;
    private final UserRepository userRepository;
    private final OrderDAO orderDAO;
    public OrderService(OrderRepository orderRepository, OrderDTOMapper orderDTOMapper, UserRepository userRepository, OrderDAO orderDAO){
        this.userRepository=userRepository;
        this.orderRepository=orderRepository;
        this.orderDTOMapper=orderDTOMapper;
        this.orderDAO=orderDAO;
    }
    //TODO: allow only the admin to get all the orders
    //@PreAuthorize("hasAuthority('ADMIN')")
    public List<OrderDTO> getAllOrders(){
        return orderDAO.findAll().stream()
                .map(orderDTOMapper::toDto)
                .collect(Collectors.toList());
    }
    //TODO: clean up
    public List<Order> getAllOrdersPerUser(User user){
//        String username = SecurityContextHolder.getContext().getAuthentication().getName();
//        User user = userRepository.findByUsername(username)
//                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return orderRepository.findByUser(user);
    }
    public OrderDTO getOrderById(long orderId){
        Order order = orderRepository.findById(orderId)
                .orElseThrow(()->new OrderNotFoundException("cannot find order with id"+orderId));
        return orderDTOMapper.toDto(order);
    }
    public OrderDTO createOrder(OrderDTO orderDTO){

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException("User not found"));

        // Map DTO to Entity and set the user
        Order order = orderDTOMapper.toEntity(orderDTO);
        order.setUser(user);

        return orderDTOMapper.toDto(orderRepository.save(order));
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    public OrderDTO updateOrder(long orderId,OrderDTO orderDTO){
        Order existingOrder = orderRepository.findById(orderId)
                .orElseThrow(()->new OrderNotFoundException("cannot find order with id"+orderId));
        orderDTOMapper.updateEntityFromDto(orderDTO, existingOrder);
        Order updatedOrder = orderRepository.save(existingOrder);
        return orderDTOMapper.toDto(updatedOrder);
    }
    @PreAuthorize("hasAuthority('ADMIN')")
    public void deleteOrder(long orderId){
        orderRepository.deleteById(orderId);
    }
}

