package com.plumma.template.dto;

public record ApiErrorResponse(
        String code,
        String message,
        int status
) {
}
