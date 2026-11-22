package com.marketplace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BookMyChefApplication {

    public static void main(String[] args) {
        SpringApplication.run(BookMyChefApplication.class, args);
    }
}
