package com.plumma.template.controller;

import com.plumma.template.exception.BadRequestException;
import com.plumma.template.service.OAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

/**
 * Flusso OAuth2 Authorization Code: {@code /start} redirige al provider,
 * {@code /callback} scambia il code, emette il JWT applicativo e rimanda al
 * frontend con il token nel fragment. Endpoint pubblici ({@code /api/public}).
 */
@RestController
@RequestMapping("/api/public/oauth")
@RequiredArgsConstructor
public class OAuthController {

    private final OAuthService oauthService;

    @GetMapping("/{provider}/start")
    public ResponseEntity<Void> start(@PathVariable final String provider) {
        final String authorizationUrl = oauthService.buildAuthorizationUrl(provider);
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, authorizationUrl)
                .build();
    }

    @GetMapping("/{provider}/callback")
    public ResponseEntity<Void> callback(
            @PathVariable final String provider,
            @RequestParam(required = false) final String code,
            @RequestParam(required = false) final String state,
            @RequestParam(required = false) final String error) {
        if (error != null && !error.isBlank()) {
            throw new BadRequestException("OAuth provider returned error: " + error);
        }

        final String redirectUrl = oauthService.handleCallback(provider, code, state);
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(redirectUrl))
                .build();
    }

}
