package com.expenseapp.repository;

import com.expenseapp.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByUserUserId(Long userId);

    List<Expense> findByUserUserIdAndDateBetween(Long userId, LocalDate start, LocalDate end);

    List<Expense> findByUserUserIdAndCategoryCategoryId(Long userId, Long categoryId);

    @Query("SELECT e FROM Expense e WHERE e.user.userId = :userId AND SUBSTRING(CAST(e.date AS string), 1, 7) = :month")
    List<Expense> findByUserIdAndMonth(@Param("userId") Long userId, @Param("month") String month);

    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.userId = :userId")
    java.math.BigDecimal sumAmountByUserId(@Param("userId") Long userId);

    boolean existsByUserUserIdAndAmountAndDateAndDescription(
            Long userId, BigDecimal amount, LocalDate date, String description);
}
