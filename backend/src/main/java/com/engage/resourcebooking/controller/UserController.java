package com.engage.resourcebooking.controller;

import com.engage.resourcebooking.dto.UserOut;
import com.engage.resourcebooking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/managers")
    public List<UserOut> getManagers() {
        return userService.getManagers();
    }
}
