package com.expenseapp.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class IncomeRequest {
    @NotNull
    private BigDecimal amount;
    private String source;
    @NotNull
    private LocalDate date;
    private String description;
    @NotNull
    private Long userId;
}
