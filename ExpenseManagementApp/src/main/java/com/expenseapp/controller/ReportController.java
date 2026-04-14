package com.expenseapp.controller;

import com.expenseapp.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyReport(@RequestParam Long userId,
                                                                  @RequestParam String month,
                                                                  @RequestParam int year) {
        return ResponseEntity.ok(reportService.getMonthlyReport(userId, month, year));
    }

    @GetMapping("/category")
    public ResponseEntity<Map<String, BigDecimal>> getCategoryReport(@RequestParam Long userId) {
        return ResponseEntity.ok(reportService.getCategoryReport(userId));
    }
}
