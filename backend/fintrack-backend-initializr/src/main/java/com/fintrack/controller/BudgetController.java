package com.fintrack.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/budget")
public class BudgetController {

    private final Map<String, Double> budgets =
            new ConcurrentHashMap<>();

    @GetMapping
    public Map<String, Double> getBudget(
            Authentication authentication) {

        String email = authentication.getName();

        return Map.of(
                "budget",
                budgets.getOrDefault(email, 0.0)
        );
    }

    @PutMapping
    public Map<String, Double> setBudget(
            @RequestBody Map<String, Double> request,
            Authentication authentication) {

        double amount =
                request.getOrDefault("budget", 0.0);

        if (amount <= 0) {
            throw new IllegalArgumentException(
                    "Budget must be greater than zero"
            );
        }

        String email = authentication.getName();

        budgets.put(email, amount);

        return Map.of(
                "budget",
                amount
        );
    }
}