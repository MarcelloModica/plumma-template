package com.plumma.template.exception;

import com.plumma.template.dto.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiErrorResponse> handleAppException(final AppException ex) {
        final ErrorCode errorCode = ex.getErrorCode();
        final ApiErrorResponse body = new ApiErrorResponse(
                errorCode.name(),
                ex.getMessage(),
                errorCode.getHttpStatus().value()
        );
        return ResponseEntity.status(errorCode.getHttpStatus()).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(final Exception ex) {
        logger.error("Unexpected error", ex);
        final ErrorCode errorCode = ErrorCode.INTERNAL_ERROR;
        final ApiErrorResponse body = new ApiErrorResponse(
                errorCode.name(),
                "Unexpected error",
                errorCode.getHttpStatus().value()
        );
        return ResponseEntity.status(errorCode.getHttpStatus()).body(body);
    }

}
