package com.example.backend.validator;

import com.example.backend.DAO.OrderDAO;
import org.apache.coyote.BadRequestException;
import org.springframework.stereotype.Component;

@Component
public class OrderValidator {
    private final OrderDAO orderDAO;
    public OrderValidator(OrderDAO orderDAO){
        this.orderDAO=orderDAO;
    }
    //TODO: validate the order with the product
    public void validateProductExists(){
    }
}
