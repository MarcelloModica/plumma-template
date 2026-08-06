package com.plumma.template.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configurazione degli Identity Provider OAuth2/OIDC (Google, Microsoft 365).
 * Tutti i valori arrivano dalle properties/env: nessun segreto hardcodato.
 */
@ConfigurationProperties(prefix = "oauth")
public record OAuthProperties(
        String frontendRedirectUrl,
        String backendBaseUrl,
        Provider google,
        Provider azure
) {

    public record Provider(
            String clientId,
            String clientSecret,
            String authorizationUrl,
            String tokenUrl,
            String userInfoUrl,
            String scopes
    ) {
    }

}
