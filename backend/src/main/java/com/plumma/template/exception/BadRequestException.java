package com.plumma.template.exception;

public class BadRequestException extends AppException {

    public BadRequestException(final String message) {
        super(ErrorCode.BAD_REQUEST, message);
    }

}
