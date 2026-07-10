package com.engage.resourcebooking.service;

import com.engage.resourcebooking.dto.LoginRequest;
import com.engage.resourcebooking.dto.TokenDto;
import com.engage.resourcebooking.dto.UserCreate;
import com.engage.resourcebooking.dto.UserOut;
import com.engage.resourcebooking.model.Department;
import com.engage.resourcebooking.model.User;
import com.engage.resourcebooking.model.UserRole;
import com.engage.resourcebooking.repository.DepartmentRepository;
import com.engage.resourcebooking.repository.UserRepository;
import com.engage.resourcebooking.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserService userService;

    @Transactional
    public TokenDto login(LoginRequest loginRequest) {
        String email = loginRequest.getEmail().toLowerCase().trim();
        String requestedRole = loginRequest.getRole() != null ? loginRequest.getRole().toLowerCase() : "employee";
        
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials for " + requestedRole));

        if (!user.isApproved()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account request is still pending admin approval.");
        }

        // Compare role as string from Enum
        if (!user.getRole().name().toLowerCase().equals(requestedRole)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials for " + requestedRole);
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword()));

            String jwt = jwtUtils.generateJwtToken(authentication);
            UserOut userOut = userService.mapToOut(user);
            return new TokenDto(jwt, "bearer", userOut);
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials for " + requestedRole);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication failed: " + e.getMessage());
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public UserOut register(UserCreate userCreate) {
        String email = userCreate.getEmail().toLowerCase().trim();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already registered");
        }

        long userCount = userRepository.count();
        UserRole role = (userCount == 0) ? UserRole.ADMIN : (userCreate.getRole() != null ? userCreate.getRole() : UserRole.EMPLOYEE);
        boolean isApproved = (userCount == 0);

        User user = new User();
        user.setEmail(email);
        user.setFullName(userCreate.getFullName());
        user.setHashedPassword(encoder.encode(userCreate.getPassword()));
        user.setRole(role);
        user.setApproved(isApproved);

        if (userCreate.getDepartmentId() != null) {
            Department dept = departmentRepository.findById(userCreate.getDepartmentId()).orElse(null);
            user.setDepartment(dept);
        }

        userRepository.save(user);
        return userService.mapToOut(user);
    }
}
