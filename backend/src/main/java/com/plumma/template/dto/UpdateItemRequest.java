package com.plumma.template.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record UpdateItemRequest(
        @NotBlank String name,
        String description,
        @PositiveOrZero int quantity
) {
}
