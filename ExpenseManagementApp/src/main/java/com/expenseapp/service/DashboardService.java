package com.expenseapp.service;

import com.expenseapp.dto.DashboardResponse;
import com.expenseapp.entity.Expense;
import com.expenseapp.repository.ExpenseRepository;
import com.expenseapp.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ExpenseRepository expenseRepository;
    private final IncomeRepository incomeRepository;

    public DashboardResponse getDashboard(Long userId) {
        BigDecimal totalIncome = incomeRepository.sumAmountByUserId(userId);
        if (totalIncome == null) totalIncome = BigDecimal.ZERO;

        BigDecimal totalExpense = expenseRepository.sumAmountByUserId(userId);
        if (totalExpense == null) totalExpense = BigDecimal.ZERO;

        BigDecimal totalBalance = totalIncome.subtract(totalExpense);

        // Recent 10 expenses
        List<Expense> recent = expenseRepository.findByUserUserId(userId)
                .stream()
                .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                .limit(10)
                .toList();

        return new DashboardResponse(totalBalance, totalIncome, totalExpense, recent);
    }
}
