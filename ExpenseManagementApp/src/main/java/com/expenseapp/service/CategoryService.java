package com.expenseapp.service;

import com.expenseapp.dto.CategoryRequest;
import com.expenseapp.entity.Category;
import com.expenseapp.entity.User;
import com.expenseapp.repository.CategoryRepository;
import com.expenseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public Category createCategory(CategoryRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Category category = Category.builder()
                .name(request.getName())
                .user(user)
                .build();
        return categoryRepository.save(category);
    }

    public List<Category> getCategoriesByUser(Long userId) {
        return categoryRepository.findByUserUserId(userId);
    }

    public Category updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        category.setName(request.getName());
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}
