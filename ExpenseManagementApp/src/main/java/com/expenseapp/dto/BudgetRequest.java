package com.expenseapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetRequest {
    @NotNull
    private BigDecimal amount;
    @NotBlank
    private String month; // "2026-04"
    @NotNull
    private Long userId;
}
