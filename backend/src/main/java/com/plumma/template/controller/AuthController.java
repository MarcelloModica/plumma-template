package com.plumma.template.controller;

import com.plumma.template.config.JwtProperties;
import com.plumma.template.dto.TokenRequest;
import com.plumma.template.dto.TokenResponse;
import com.plumma.template.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Login username/password: emette il JWT applicativo. Endpoint pubblico
 * ({@code POST /token}), allineato al contratto del frontend.
 */
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    @PostMapping("/token")
    public TokenResponse token(@Valid @RequestBody final TokenRequest request) {
        final String accessToken = authService.authenticateAndCreateToken(
                request.username(),
                request.password());
        return new TokenResponse(accessToken, "Bearer", jwtProperties.expirationSeconds());
    }

}
