package com.example.backend.DAO;

import com.example.backend.entity.Order;
import com.example.backend.repository.OrderRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class OrderDAO {
    private final OrderRepository orderRepository;
    public OrderDAO(OrderRepository orderRepository){
        this.orderRepository=orderRepository;
    }
    public List<Order> findAll(){
        return orderRepository.findAll();
    }
    public boolean existsById(Long id){
        return orderRepository.existsById(id);
    }
    public Order save(Order order){
        return orderRepository.save(order);
    }
    public Optional<Order> findById(Long id){
        return orderRepository.findById(id);
    }
    public void deleteById(Long id){
        orderRepository.deleteById(id);
    }
}
