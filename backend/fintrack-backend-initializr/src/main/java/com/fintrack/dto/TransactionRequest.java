package com.fintrack.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class TransactionRequest {
    @NotBlank
    private String type;

    @NotBlank
    private String title;

    @NotBlank
    private String category;

    @NotNull
    @Positive
    private Double amount;

    @NotNull
    private LocalDate date;

    private String note;
}
