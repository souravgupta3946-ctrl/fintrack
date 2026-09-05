package com.fintrack.repository;

import com.fintrack.model.Transaction;
import com.fintrack.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserOrderByDateDescIdDesc(User user);
    List<Transaction> findByUserAndTypeOrderByDateDescIdDesc(User user, String type);
    java.util.Optional<Transaction> findByIdAndUser(Long id, User user);
}
