package com.plumma.template.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health check per il load balancer / Elastic Beanstalk.
 * Path allineato a {@code health_check_path} del Terraform: {@code /services/health/check}.
 */
@RestController
@RequestMapping("/services/health")
public class HealthController {

    @GetMapping("/check")
    public boolean check() {
        return true;
    }

}
