package com.plumma.template.exception;

public class NotFoundException extends AppException {

    public NotFoundException(final String message) {
        super(ErrorCode.NOT_FOUND, message);
    }

}
