package com.engage.resourcebooking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ResourceBookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(ResourceBookingApplication.class, args);
    }

}
