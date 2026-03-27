package com.example.backend.DTOMapper;


import com.example.backend.dto.CategoryDTO;
import com.example.backend.entity.Category;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface CategoryDTOMapper {
    Category toEntity(CategoryDTO categoryDTO);
    CategoryDTO toDto(Category category);
    @Mapping(target = "id", ignore = true)
    void updateEntityFromDto(CategoryDTO dto, @MappingTarget Category entity);

}
