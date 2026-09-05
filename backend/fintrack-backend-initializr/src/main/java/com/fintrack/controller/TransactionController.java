package com.fintrack.controller;

import com.fintrack.dto.TransactionRequest;
import com.fintrack.dto.TransactionResponse;
import com.fintrack.model.Transaction;
import com.fintrack.model.User;
import com.fintrack.repository.TransactionRepository;
import com.fintrack.repository.UserRepository;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    public TransactionController(
            TransactionRepository transactionRepository,
            UserRepository userRepository
    ) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
    }

    private User currentUser(Authentication authentication) {

        return userRepository
                .findByEmail(authentication.getName())
                .orElseThrow(() ->
                        new IllegalStateException("User not found"));
    }

    private TransactionResponse toResponse(Transaction t) {

        return new TransactionResponse(
                t.getId(),
                t.getType(),
                t.getTitle(),
                t.getCategory(),
                t.getAmount(),
                t.getDate(),
                t.getNote()
        );
    }


    // =========================
    // GET ALL TRANSACTIONS
    // =========================

    @GetMapping
    public List<TransactionResponse> getAll(
            Authentication authentication
    ) {

        User user = currentUser(authentication);

        return transactionRepository
                .findByUserOrderByDateDescIdDesc(user)
                .stream()
                .map(this::toResponse)
                .toList();
    }


    // =========================
    // CREATE TRANSACTION
    // =========================

    @PostMapping
    public ResponseEntity<TransactionResponse> create(
            @Valid @RequestBody TransactionRequest request,
            Authentication authentication
    ) {

        User user = currentUser(authentication);

        Transaction transaction = Transaction.builder()
                .type(request.getType().toUpperCase())
                .title(request.getTitle())
                .category(request.getCategory())
                .amount(request.getAmount())
                .date(request.getDate())
                .note(request.getNote())
                .user(user)
                .build();

        Transaction saved =
                transactionRepository.save(transaction);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(saved));
    }


    // =========================
    // UPDATE TRANSACTION
    // =========================

    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @Valid @RequestBody TransactionRequest request,
            Authentication authentication
    ) {

        User user = currentUser(authentication);

        Transaction transaction =
                transactionRepository
                        .findByIdAndUser(id, user)
                        .orElse(null);

        if (transaction == null) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Transaction not found");
        }

        transaction.setType(
                request.getType().toUpperCase()
        );

        transaction.setTitle(
                request.getTitle()
        );

        transaction.setCategory(
                request.getCategory()
        );

        transaction.setAmount(
                request.getAmount()
        );

        transaction.setDate(
                request.getDate()
        );

        transaction.setNote(
                request.getNote()
        );

        Transaction updated =
                transactionRepository.save(transaction);

        return ResponseEntity.ok(
                toResponse(updated)
        );
    }


    // =========================
    // DELETE TRANSACTION
    // =========================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            Authentication authentication
    ) {

        User user = currentUser(authentication);

        Transaction transaction =
                transactionRepository
                        .findByIdAndUser(id, user)
                        .orElse(null);

        if (transaction == null) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Transaction not found");
        }

        transactionRepository.delete(transaction);

        return ResponseEntity.ok(
                "Transaction deleted successfully"
        );
    }
}