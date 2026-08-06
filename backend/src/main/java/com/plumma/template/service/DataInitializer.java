package com.plumma.template.service;

import com.plumma.template.config.AppProperties;
import com.plumma.template.entity.AppUser;
import com.plumma.template.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Al primo avvio, se non esistono utenti, crea l'utente demo locale definito
 * nelle properties ({@code app.demo-user.*}). Cosi' il template e' subito
 * usabile con un login funzionante, mentre le utenze reali verranno gestite
 * su DB.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AppProperties appProperties;

    @Override
    public void run(final String... args) {
        final AppProperties.DemoUser demo = appProperties.demoUser();
        if (demo == null || !demo.enabled()) {
            return;
        }
        if (appUserRepository.count() > 0) {
            return;
        }
        final AppUser user = new AppUser();
        user.setUsername(demo.username());
        user.setEmail(demo.email());
        user.setPasswordHash(passwordEncoder.encode(demo.password()));
        user.setRole(demo.role());
        user.setEnabled(true);
        appUserRepository.save(user);
        logger.info("Utente demo '{}' creato al primo avvio (role={}). "
                + "Cambia o disabilita app.demo-user.* in produzione.", demo.username(), demo.role());
    }

}
