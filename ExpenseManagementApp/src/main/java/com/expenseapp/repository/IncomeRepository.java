package com.expenseapp.repository;

import com.expenseapp.entity.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface IncomeRepository extends JpaRepository<Income, Long> {
    List<Income> findByUserUserId(Long userId);

    @Query("SELECT SUM(i.amount) FROM Income i WHERE i.user.userId = :userId")
    java.math.BigDecimal sumAmountByUserId(@Param("userId") Long userId);

    boolean existsByUserUserIdAndAmountAndDateAndDescription(
            Long userId, BigDecimal amount, LocalDate date, String description);
}
