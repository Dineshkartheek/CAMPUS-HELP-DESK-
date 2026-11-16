package com.campuscare.service;

import com.campuscare.dto.AdminDtos;
import com.campuscare.dto.DtoMapper;
import com.campuscare.dto.TicketDtos;
import com.campuscare.exception.ApiException;
import com.campuscare.model.Category;
import com.campuscare.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Category management used by ticket forms and the Main Admin module. */
@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<TicketDtos.CategoryDto> listActive() {
        return categoryRepository.findByActiveTrueOrderByNameAsc()
                .stream().map(DtoMapper::toCategoryDto).toList();
    }

    @Transactional(readOnly = true)
    public List<TicketDtos.CategoryDto> listAll() {
        return categoryRepository.findAllByOrderByNameAsc()
                .stream().map(DtoMapper::toCategoryDto).toList();
    }

    @Transactional
    public TicketDtos.CategoryDto create(AdminDtos.CategoryRequest request) {
        String name = request.name().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("A category with this name already exists.");
        }
        Category category = new Category(name, trimToNull(request.description()));
        return DtoMapper.toCategoryDto(categoryRepository.save(category));
    }

    @Transactional
    public TicketDtos.CategoryDto update(Long id, AdminDtos.CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Category not found."));

        String name = request.name().trim();
        categoryRepository.findByNameIgnoreCase(name).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw ApiException.conflict("A category with this name already exists.");
            }
        });

        category.setName(name);
        category.setDescription(trimToNull(request.description()));
        if (request.active() != null) {
            category.setActive(request.active());
        }
        return DtoMapper.toCategoryDto(categoryRepository.save(category));
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
