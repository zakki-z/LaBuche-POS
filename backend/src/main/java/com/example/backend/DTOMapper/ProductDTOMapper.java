package com.example.backend.DTOMapper;
import com.example.backend.dto.ProductDTO;
import com.example.backend.entity.Product;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;


@Mapper(componentModel = "spring")
public interface ProductDTOMapper {
    Product toEntity(ProductDTO dto);
    ProductDTO toDto(Product product);
    @Mapping(target = "id", ignore = true)
    void updateEntityFromDto(ProductDTO dto, @MappingTarget Product entity);
}
