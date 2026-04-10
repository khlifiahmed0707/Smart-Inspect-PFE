package com.example.demo.dto;

import com.example.demo.entity.Personne;
import com.fasterxml.jackson.annotation.JsonProperty;

public class LoginResponse {
    private boolean success;
    private String message;
    private String role;
    private Personne user;
    private boolean needsFaceAuth;
    private boolean isFirstLogin;

    public LoginResponse(boolean success, String message, String role, Personne user) {
        this.success = success;
        this.message = message;
        this.role = role;
        this.user = user;
        this.needsFaceAuth = false;
        this.isFirstLogin = false;
    }

    public LoginResponse(boolean success, String message, String role, Personne user, boolean needsFaceAuth) {
        this.success = success;
        this.message = message;
        this.role = role;
        this.user = user;
        this.needsFaceAuth = needsFaceAuth;
        this.isFirstLogin = false;
    }

    public LoginResponse(boolean success, String message, String role, Personne user, boolean needsFaceAuth, boolean isFirstLogin) {
        this.success = success;
        this.message = message;
        this.role = role;
        this.user = user;
        this.needsFaceAuth = needsFaceAuth;
        this.isFirstLogin = isFirstLogin;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Personne getUser() { return user; }
    public void setUser(Personne user) { this.user = user; }

    public boolean isNeedsFaceAuth() { return needsFaceAuth; }
    public void setNeedsFaceAuth(boolean needsFaceAuth) { this.needsFaceAuth = needsFaceAuth; }

    @JsonProperty("isFirstLogin")
    public boolean isFirstLogin() { return isFirstLogin; }
    public void setFirstLogin(boolean firstLogin) { isFirstLogin = firstLogin; }
}
