package com.example.backend.service;


import com.example.backend.dto.ProductDTO;

import java.util.List;


public interface ProductService {
    public ProductDTO createProduct(ProductDTO dto);
    public List<ProductDTO> getAllProducts();
    public ProductDTO updateProduct(Long id, ProductDTO productDTO);
    public ProductDTO getProductById(Long id);
    public void deleteProduct(Long id);
}
