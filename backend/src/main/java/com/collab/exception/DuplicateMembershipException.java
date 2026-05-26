package com.collab.exception;

public class DuplicateMembershipException extends RuntimeException {
    public DuplicateMembershipException(String message) {
        super(message);
    }
}
