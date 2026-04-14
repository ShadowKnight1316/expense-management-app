package com.expenseapp.service;

import com.expenseapp.entity.Expense;
import com.expenseapp.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ExpenseRepository expenseRepository;

    public Map<String, Object> getMonthlyReport(Long userId, String month, int year) {
        String monthStr = String.format("%d-%02d", year, month.length() == 1 ? Integer.parseInt(month) : Integer.parseInt(month));
        List<Expense> expenses = expenseRepository.findByUserIdAndMonth(userId, monthStr);

        BigDecimal total = expenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return Map.of(
                "month", monthStr,
                "totalExpense", total,
                "transactions", expenses
        );
    }

    public Map<String, BigDecimal> getCategoryReport(Long userId) {
        List<Expense> expenses = expenseRepository.findByUserUserId(userId);
        return expenses.stream()
                .filter(e -> e.getCategory() != null)
                .collect(Collectors.groupingBy(
                        e -> e.getCategory().getName(),
                        Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)
                ));
    }
}
