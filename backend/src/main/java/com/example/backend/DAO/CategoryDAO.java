package com.example.backend.DAO;

import com.example.backend.entity.Category;
import com.example.backend.repository.CategoryRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class CategoryDAO {
    private final CategoryRepository categoryRepository;
    public CategoryDAO(CategoryRepository categoryRepository){
        this.categoryRepository=categoryRepository;
    }
    public List<Category> getAllCategories(){
        return categoryRepository.findAll();
    }
    public Optional<Category> findById(Long id){
        return categoryRepository.findById(id);
    }
    public Category createCategory(Category category){
        return categoryRepository.save(category);
    }
    public boolean categoryExistsByName(String name){
        return categoryRepository.existsByName(name);
    }
    public boolean categoryExistsById(Long id){
        return categoryRepository.existsById(id);
    }
    public void deleteById(Long id){
        categoryRepository.deleteById(id);
    }
}
