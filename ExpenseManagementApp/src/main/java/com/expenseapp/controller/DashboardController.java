package com.expenseapp.controller;

import com.expenseapp.dto.DashboardResponse;
import com.expenseapp.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@RequestParam Long userId) {
        return ResponseEntity.ok(dashboardService.getDashboard(userId));
    }
}
