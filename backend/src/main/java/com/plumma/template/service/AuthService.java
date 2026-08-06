package com.plumma.template.service;

import com.plumma.template.config.JwtProperties;
import com.plumma.template.entity.AppUser;
import com.plumma.template.exception.InvalidCredentialsException;
import com.plumma.template.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

/**
 * Autenticazione username/password contro gli utenti su DB (incluso l'utente
 * demo seedato al primo avvio) ed emissione del JWT applicativo. Il metodo
 * {@link #createToken} e' riusato anche dal flusso OAuth.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final JwtProperties jwtProperties;

    @Transactional(readOnly = true)
    public String authenticateAndCreateToken(final String username, final String password) {
        final AppUser user = appUserRepository.findByUsername(username)
                .filter(AppUser::isEnabled)
                .filter(u -> u.getPasswordHash() != null
                        && passwordEncoder.matches(password, u.getPasswordHash()))
                .orElseThrow(() -> new InvalidCredentialsException("Credenziali non valide"));

        return createToken(
                user.getUsername(),
                user.getRole(),
                user.getFirstName(),
                user.getLastName(),
                Map.of());
    }

    public String createToken(
            final String subject,
            final String role,
            final String firstName,
            final String lastName,
            final Map<String, String> extraClaims) {
        final Instant now = Instant.now();
        final JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
                .issuer("plumma-template")
                .subject(subject)
                .issuedAt(now)
                .expiresAt(now.plusSeconds(jwtProperties.expirationSeconds()));

        if (role != null && !role.isBlank()) {
            claims.claim("role", role);
        }
        if (firstName != null && !firstName.isBlank()) {
            claims.claim("firstName", firstName);
        }
        if (lastName != null && !lastName.isBlank()) {
            claims.claim("lastName", lastName);
        }
        if (extraClaims != null) {
            extraClaims.forEach((key, value) -> {
                if (key != null && !key.isBlank() && value != null && !value.isBlank()) {
                    claims.claim(key, value);
                }
            });
        }

        final JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return jwtEncoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
    }

}
