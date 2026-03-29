package com.example.backend.service;

import com.example.backend.dto.OrderDTO;

import java.util.List;

public interface OrderService {
    public OrderDTO createOrder(OrderDTO dto);
    public List<OrderDTO> getAllOrders();
    public OrderDTO updateOrder(Long id, OrderDTO dto);
    public OrderDTO getOrderById(Long id);
    public void deleteOrder(Long id);
}

