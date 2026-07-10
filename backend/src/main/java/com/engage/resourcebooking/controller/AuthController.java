package com.engage.resourcebooking.controller;

import com.engage.resourcebooking.dto.LoginRequest;
import com.engage.resourcebooking.dto.TokenDto;
import com.engage.resourcebooking.dto.UserCreate;
import com.engage.resourcebooking.dto.UserOut;
import com.engage.resourcebooking.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public TokenDto login(@RequestBody LoginRequest loginRequest) {
        return authService.login(loginRequest);
    }

    @PostMapping("/register")
    public UserOut register(@RequestBody UserCreate userCreate) {
        return authService.register(userCreate);
    }
}
