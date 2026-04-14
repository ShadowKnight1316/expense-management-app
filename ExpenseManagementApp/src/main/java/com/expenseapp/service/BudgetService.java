package com.expenseapp.service;

import com.expenseapp.dto.BudgetRequest;
import com.expenseapp.entity.Budget;
import com.expenseapp.entity.User;
import com.expenseapp.repository.BudgetRepository;
import com.expenseapp.repository.ExpenseRepository;
import com.expenseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;

    public Budget setBudget(BudgetRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Optional<Budget> existing = budgetRepository.findByUserUserIdAndMonth(request.getUserId(), request.getMonth());
        Budget budget = existing.orElse(Budget.builder().user(user).build());
        budget.setAmount(request.getAmount());
        budget.setMonth(request.getMonth());
        return budgetRepository.save(budget);
    }

    public Map<String, Object> getBudget(Long userId, String month) {
        Budget budget = budgetRepository.findByUserUserIdAndMonth(userId, month)
                .orElseThrow(() -> new RuntimeException("Budget not found"));

        BigDecimal spent = expenseRepository.findByUserIdAndMonth(userId, month)
                .stream()
                .map(e -> e.getAmount())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> result = new HashMap<>();
        result.put("budget", budget.getAmount());
        result.put("spent", spent);
        result.put("remaining", budget.getAmount().subtract(spent));

        BigDecimal percentage = spent.divide(budget.getAmount(), 2, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100));
        result.put("percentageUsed", percentage);

        if (percentage.compareTo(BigDecimal.valueOf(100)) >= 0) {
            result.put("alert", "Budget exceeded!");
        } else if (percentage.compareTo(BigDecimal.valueOf(80)) >= 0) {
            result.put("alert", "80% of budget reached!");
        }

        return result;
    }
}
