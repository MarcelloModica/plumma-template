package com.plumma.template.exception;

public class InvalidCredentialsException extends AppException {

    public InvalidCredentialsException(final String message) {
        super(ErrorCode.INVALID_CREDENTIALS, message);
    }

}
