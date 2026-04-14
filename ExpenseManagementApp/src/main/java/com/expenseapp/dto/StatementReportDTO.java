package com.expenseapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatementReportDTO {
    private int totalEntries;
    private int expenseCount;
    private int incomeCount;
    private BigDecimal totalExpense;
    private BigDecimal totalIncome;
    private BigDecimal netBalance;
    private Map<String, BigDecimal> categoryBreakdown;
    private List<StatementEntryDTO> entries;
}
