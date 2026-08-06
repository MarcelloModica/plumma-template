package com.plumma.template.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configurazione applicativa generica del template.
 *
 * <p>{@code app.demo-user.*} definisce l'utente demo locale che viene creato
 * automaticamente al primo avvio (vedi {@code DataInitializer}) quando la
 * tabella utenti e' vuota. In produzione le utenze reali arrivano dal DB.</p>
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String frontendBaseUrl,
        DemoUser demoUser
) {

    public record DemoUser(
            boolean enabled,
            String username,
            String email,
            String password,
            String role
    ) {
    }

}
