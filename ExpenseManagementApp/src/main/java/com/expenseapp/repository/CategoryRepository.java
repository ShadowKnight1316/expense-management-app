package com.expenseapp.repository;

import com.expenseapp.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserUserId(Long userId);
}
