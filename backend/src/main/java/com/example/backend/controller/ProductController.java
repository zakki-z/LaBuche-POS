package com.example.backend.controller;

import com.example.backend.dto.ProductDTO;
import com.example.backend.entity.Product;
import com.example.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1.0/products")
public class ProductController {
    private final ProductService productService;
    public ProductController(ProductService productService){
        this.productService=productService;
    }
    @GetMapping()
    @ResponseStatus(value = HttpStatus.OK)
    public List<ProductDTO> getAllProducts(){
        return productService.getAllProducts();
    }
    @GetMapping("/{productId}")
    @ResponseStatus(value = HttpStatus.OK)
    public ProductDTO getProductById(@PathVariable Long productId){
        return productService.getProductById(productId);
    }
    @PostMapping()
    @ResponseStatus(value = HttpStatus.CREATED)
    public ProductDTO createProduct(@RequestBody @Valid ProductDTO productDTO){
        return productService.createProduct(productDTO);
    }
    @PutMapping("/{productId}")
    @ResponseStatus(value = HttpStatus.OK)
    public ProductDTO updateProduct(@PathVariable long productId,@RequestBody @Valid ProductDTO productDto){
        return productService.updateProduct(productId,productDto);
    }
    @DeleteMapping("/{productId}")
    @ResponseStatus(value = HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable Long productId){
        productService.deleteProduct(productId);
    }
}
