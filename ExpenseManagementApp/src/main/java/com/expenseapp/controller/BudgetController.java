package com.expenseapp.controller;

import com.expenseapp.dto.BudgetRequest;
import com.expenseapp.entity.Budget;
import com.expenseapp.service.BudgetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<Budget> setBudget(@Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.setBudget(request));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getBudget(@RequestParam Long userId,
                                                          @RequestParam String month) {
        return ResponseEntity.ok(budgetService.getBudget(userId, month));
    }
}
