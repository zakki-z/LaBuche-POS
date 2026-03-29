package com.example.backend.service.impl;

import com.example.backend.DAO.CategoryDAO;
import com.example.backend.DAO.ProductDAO;
import com.example.backend.DTOMapper.ProductDTOMapper;
import com.example.backend.dto.ProductDTO;
import com.example.backend.entity.Category;
import com.example.backend.entity.Product;
import com.example.backend.exception.ProductNotFoundException;
import com.example.backend.service.ProductService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProductServiceImpl implements ProductService {
    private final ProductDAO productDAO;
    private final ProductDTOMapper productDTOMapper;
    private final CategoryDAO categoryDAO;

    public ProductServiceImpl(ProductDAO productDAO, ProductDTOMapper productDTOMapper, CategoryDAO categoryDAO) {
        this.productDAO = productDAO;
        this.productDTOMapper = productDTOMapper;
        this.categoryDAO = categoryDAO;
    }

    @Override
    public ProductDTO createProduct(ProductDTO productDTO) {
        Product product = productDTOMapper.toEntity(productDTO);
        if (productDTO.categoryId() != null) {
            Category category = categoryDAO.findById(productDTO.categoryId())
                    .orElseThrow(() -> new ProductNotFoundException("Category not found with id " + productDTO.categoryId()));
            product.setCategory(category);
        }
        return productDTOMapper.toDto(productDAO.save(product));
    }

    @Override
    public List<ProductDTO> getAllProducts() {
        return productDAO.findAll().stream()
                .map(productDTOMapper::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public ProductDTO updateProduct(Long id, ProductDTO productDTO) {
        Product existingProduct = productDAO.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Cannot find product with id " + id));
        productDTOMapper.updateEntityFromDto(productDTO, existingProduct);
        if (productDTO.categoryId() != null) {
            Category category = categoryDAO.findById(productDTO.categoryId())
                    .orElseThrow(() -> new ProductNotFoundException("Category not found with id " + productDTO.categoryId()));
            existingProduct.setCategory(category);
        }
        Product updatedProduct = productDAO.save(existingProduct);
        return productDTOMapper.toDto(updatedProduct);
    }

        @Override
        public ProductDTO getProductById (Long id){
            var product = productDAO.findById(id)
                    .orElseThrow(() -> new ProductNotFoundException("cannot find product with id: " + id));
            return productDTOMapper.toDto(product);
        }
        @Override
        public void deleteProduct (Long id){
            if (!productDAO.existsById(id)) {
                throw new ProductNotFoundException("cannot find product with id: " + id);
            }
            productDAO.deleteById(id);
        }
    }
