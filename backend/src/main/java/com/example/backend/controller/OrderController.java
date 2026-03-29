package com.example.backend.controller;

import com.example.backend.dto.OrderDTO;
import com.example.backend.entity.Order;
import com.example.backend.entity.User;
import com.example.backend.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1.0/orders")
public class OrderController {
    private final OrderService orderService;
    public OrderController(OrderService orderService){
        this.orderService=orderService;
    }
    @GetMapping()
    @ResponseStatus(value = HttpStatus.OK)
    public List<OrderDTO> getAllOrders(){
        return orderService.getAllOrders();
    }
    @GetMapping("/{orderId}")
    @ResponseStatus(value = HttpStatus.OK)
    public OrderDTO getOrderById(@PathVariable long orderId){
        return orderService.getOrderById(orderId);
    }
    @PostMapping()
    @ResponseStatus(value = HttpStatus.CREATED)
    public OrderDTO createOrder(@RequestBody @Valid OrderDTO orderDTO){
        return orderService.createOrder(orderDTO);
    }
    @PutMapping("/{orderId}")
    @ResponseStatus(value = HttpStatus.OK)
    public OrderDTO updateOrder(@PathVariable long orderId,@RequestBody @Valid OrderDTO orderDTO){
        return orderService.updateOrder(orderId,orderDTO);
    }
    @DeleteMapping("/{orderId}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteOrder(@PathVariable long orderId){
        orderService.deleteOrder(orderId);
    }
}
