package com.expenseapp.controller;

import com.expenseapp.dto.StatementReportDTO;
import com.expenseapp.service.BankStatementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/statement")
@RequiredArgsConstructor
public class BankStatementController {

    private final BankStatementService bankStatementService;

    /**
     * Preview: parse the CSV and return detected entries WITHOUT saving to DB.
     * POST /api/v1/statement/preview?userId=1
     */
    @PostMapping("/preview")
    public ResponseEntity<?> preview(
            @RequestParam("file") MultipartFile file,
            @RequestParam Long userId,
            @RequestParam(required = false) String password) {
        try {
            StatementReportDTO report = bankStatementService.parseAndSave(file, userId, false,
                    password != null ? password.trim() : null);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Import: parse and SAVE all entries to DB, then return the report.
     * POST /api/v1/statement/import?userId=1
     */
    @PostMapping("/import")
    public ResponseEntity<?> importStatement(
            @RequestParam("file") MultipartFile file,
            @RequestParam Long userId,
            @RequestParam(required = false) String password) {
        try {
            StatementReportDTO report = bankStatementService.parseAndSave(file, userId, true,
                    password != null ? password.trim() : null);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Remove duplicate transactions for a user.
     * DELETE /api/v1/statement/duplicates?userId=1
     */
    @DeleteMapping("/duplicates")
    public ResponseEntity<?> removeDuplicates(@RequestParam Long userId) {
        try {
            Map<String, Integer> result = bankStatementService.removeDuplicates(userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Remove ALL transactions imported via bank statement (paymentMode = 'Bank Transfer').
     * DELETE /api/v1/statement/all?userId=1
     */
    @DeleteMapping("/all")
    public ResponseEntity<?> removeAllStatementData(@RequestParam Long userId) {
        try {
            Map<String, Integer> result = bankStatementService.removeAllStatementData(userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
