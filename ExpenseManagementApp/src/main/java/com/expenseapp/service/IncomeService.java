package com.expenseapp.service;

import com.expenseapp.dto.IncomeRequest;
import com.expenseapp.entity.Income;
import com.expenseapp.entity.User;
import com.expenseapp.repository.IncomeRepository;
import com.expenseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final UserRepository userRepository;

    public Income addIncome(IncomeRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Income income = Income.builder()
                .user(user)
                .amount(request.getAmount())
                .source(request.getSource())
                .date(request.getDate())
                .description(request.getDescription())
                .build();
        return incomeRepository.save(income);
    }

    public List<Income> getIncomeByUser(Long userId) {
        return incomeRepository.findByUserUserId(userId);
    }

    public Income updateIncome(Long id, IncomeRequest request) {
        Income income = incomeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Income not found"));
        income.setAmount(request.getAmount());
        income.setSource(request.getSource());
        income.setDate(request.getDate());
        income.setDescription(request.getDescription());
        return incomeRepository.save(income);
    }

    public void deleteIncome(Long id) {
        incomeRepository.deleteById(id);
    }
}
