package com.expenseapp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ExpenseRequest {
    @NotNull
    private BigDecimal amount;
    @NotNull
    private Long categoryId;
    @NotNull
    private LocalDate date;
    private String description;
    private String paymentMode;
    @NotNull
    private Long userId;
}
