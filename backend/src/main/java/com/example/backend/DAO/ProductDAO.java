package com.example.backend.DAO;

import com.example.backend.entity.Product;
import com.example.backend.repository.ProductRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ProductDAO {
    private final ProductRepository productRepository;
    public ProductDAO(ProductRepository productRepository){
        this.productRepository=productRepository;
    }
    public List<Product> findAll(){
        return productRepository.findAll();
    }
    public Optional<Product> findById(Long id){
        return productRepository.findById(id);
    }
    public boolean existsById(Long id){
        return productRepository.existsById(id);
    }
    public Product save(Product product){
        return productRepository.save(product);
    }
    public boolean existsByName(String name) {
        return productRepository.existsByName(name);
    }
    public void deleteById(Long id){
        productRepository.deleteById(id);
    }
}
