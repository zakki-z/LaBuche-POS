package com.example.backend.DTOMapper;
import com.example.backend.dto.ProductDTO;
import com.example.backend.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;


@Mapper(componentModel = "spring")
public interface ProductDTOMapper {

    @Mapping(source = "category.id", target = "categoryId")
    @Mapping(source = "category.name", target = "categoryName")
    ProductDTO toDto(Product product);

    @Mapping(target = "category", ignore = true)
    Product toEntity(ProductDTO dto);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "category", ignore = true)
    void updateEntityFromDto(ProductDTO dto, @MappingTarget Product entity);
}
