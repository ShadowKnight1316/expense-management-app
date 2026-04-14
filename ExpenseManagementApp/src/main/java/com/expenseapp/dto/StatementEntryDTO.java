package com.expenseapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatementEntryDTO {
    private String date;
    private String description;
    private BigDecimal amount;
    private String type;        // "income" or "expense"
    private String category;    // auto-detected
    private String paymentMode; // default "Bank Transfer"
}
