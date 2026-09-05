package com.fintrack.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@AllArgsConstructor
public class TransactionResponse {

    private Long id;
    private String type;
    private String title;
    private String category;
    private Double amount;
    private LocalDate date;
    private String note;
}