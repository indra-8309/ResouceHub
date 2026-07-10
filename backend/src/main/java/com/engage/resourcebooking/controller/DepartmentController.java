package com.engage.resourcebooking.controller;

import com.engage.resourcebooking.dto.DepartmentOut;
import com.engage.resourcebooking.model.Department;
import com.engage.resourcebooking.repository.DepartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    @Autowired
    private DepartmentRepository departmentRepository;

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    @GetMapping
    public List<DepartmentOut> getDepartments() {
        return departmentRepository.findAll().stream().map(d -> {
            DepartmentOut out = new DepartmentOut();
            out.setId(d.getId());
            out.setName(d.getName());
            return out;
        }).collect(Collectors.toList());
    }
}
