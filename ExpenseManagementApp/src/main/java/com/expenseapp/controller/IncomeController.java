package com.expenseapp.controller;

import com.expenseapp.dto.IncomeRequest;
import com.expenseapp.entity.Income;
import com.expenseapp.service.IncomeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/income")
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeService incomeService;

    @PostMapping
    public ResponseEntity<Income> addIncome(@Valid @RequestBody IncomeRequest request) {
        return ResponseEntity.ok(incomeService.addIncome(request));
    }

    @GetMapping
    public ResponseEntity<List<Income>> getIncome(@RequestParam Long userId) {
        return ResponseEntity.ok(incomeService.getIncomeByUser(userId));
    }

    @PutMapping("/{incomeId}")
    public ResponseEntity<Income> updateIncome(@PathVariable Long incomeId,
                                                @Valid @RequestBody IncomeRequest request) {
        return ResponseEntity.ok(incomeService.updateIncome(incomeId, request));
    }

    @DeleteMapping("/{incomeId}")
    public ResponseEntity<Void> deleteIncome(@PathVariable Long incomeId) {
        incomeService.deleteIncome(incomeId);
        return ResponseEntity.noContent().build();
    }
}
