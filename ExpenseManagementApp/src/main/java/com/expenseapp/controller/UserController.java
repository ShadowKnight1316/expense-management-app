package com.expenseapp.controller;

import com.expenseapp.entity.User;
import com.expenseapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // In-memory OTP store (userId -> {otp, newEmail})
    private final ConcurrentHashMap<Long, Map<String, String>> otpStore = new ConcurrentHashMap<>();

    @GetMapping("/{userId}")
    public ResponseEntity<User> getUser(@PathVariable Long userId) {
        return userRepository.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        return userRepository.findById(userId).map(user -> {
            if (body.containsKey("name") && !body.get("name").isBlank())
                user.setName(body.get("name"));
            if (body.containsKey("phone"))
                user.setPhone(body.get("phone"));
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Step 1: Request email change — generates OTP (simulated, printed to console) */
    @PostMapping("/{userId}/request-email-change")
    public ResponseEntity<?> requestEmailChange(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        String newEmail = body.get("newEmail");
        if (newEmail == null || newEmail.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "New email is required"));
        if (userRepository.existsByEmail(newEmail))
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));

        // Generate 6-digit OTP
        String otp = String.format("%06d", (int)(Math.random() * 1000000));
        otpStore.put(userId, Map.of("otp", otp, "newEmail", newEmail));

        // In production, send via email. For now, log it.
        System.out.println("[OTP] User " + userId + " email change OTP: " + otp + " → " + newEmail);

        return ResponseEntity.ok(Map.of("message", "OTP sent to " + newEmail + " (check server console for demo OTP)"));
    }

    /** Step 2: Verify OTP and update email */
    @PostMapping("/{userId}/verify-email-change")
    public ResponseEntity<?> verifyEmailChange(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        String otp = body.get("otp");
        Map<String, String> stored = otpStore.get(userId);
        if (stored == null)
            return ResponseEntity.badRequest().body(Map.of("error", "No pending email change. Request OTP first."));
        if (!stored.get("otp").equals(otp))
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid OTP"));

        String newEmail = stored.get("newEmail");
        return userRepository.findById(userId).map(user -> {
            user.setEmail(newEmail);
            userRepository.save(user);
            otpStore.remove(userId);
            return ResponseEntity.ok(Map.of("message", "Email updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    /** Change password */
    @PostMapping("/{userId}/change-password")
    public ResponseEntity<?> changePassword(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");
        if (currentPassword == null || newPassword == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Both current and new password required"));
        if (newPassword.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));

        return userRepository.findById(userId).map(user -> {
            if (!passwordEncoder.matches(currentPassword, user.getPassword()))
                return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);
            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
