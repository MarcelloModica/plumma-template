package com.plumma.template.service;

import com.plumma.template.config.JwtProperties;
import com.plumma.template.config.OAuthProperties;
import com.plumma.template.entity.AppUser;
import com.plumma.template.exception.BadRequestException;
import com.plumma.template.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Login OAuth2/OIDC generico (Google, Microsoft 365/azure).
 *
 * <p>L'utente viene risolto per email su {@link AppUser}: se esiste ed e'
 * abilitato usa il suo ruolo, altrimenti riceve il ruolo {@code registerme}
 * (il frontend lo instrada verso la registrazione). Lo {@code state} e' firmato
 * HMAC con il segreto JWT per proteggere da CSRF.</p>
 */
@Service
public class OAuthService {

    private static final Logger logger = LoggerFactory.getLogger(OAuthService.class);

    private static final String REGISTERME_ROLE = "registerme";
    private static final long STATE_TTL_SECONDS = 600;
    private static final String DEFAULT_SCOPES = "openid email";

    private final OAuthProperties oauthProperties;
    private final JwtProperties jwtProperties;
    private final AuthService authService;
    private final AppUserRepository appUserRepository;
    private final RestClient oauthRestClient;

    public OAuthService(
            final OAuthProperties oauthProperties,
            final JwtProperties jwtProperties,
            final AuthService authService,
            final AppUserRepository appUserRepository,
            @Qualifier("oauthRestClient") final RestClient oauthRestClient) {
        this.oauthProperties = oauthProperties;
        this.jwtProperties = jwtProperties;
        this.authService = authService;
        this.appUserRepository = appUserRepository;
        this.oauthRestClient = oauthRestClient;
    }

    public String buildAuthorizationUrl(final String providerId) {
        final ProviderContext provider = resolveProvider(providerId);
        final String state = createState(provider.id());

        return UriComponentsBuilder
                .fromUriString(provider.config().authorizationUrl())
                .queryParam("client_id", provider.config().clientId())
                .queryParam("redirect_uri", callbackUrl(provider.id()))
                .queryParam("response_type", "code")
                .queryParam(
                        "scope",
                        StringUtils.hasText(provider.config().scopes())
                                ? provider.config().scopes()
                                : DEFAULT_SCOPES)
                .queryParam("state", state)
                .encode()
                .build()
                .toUriString();
    }

    public String handleCallback(final String providerId, final String code, final String state) {
        if (!StringUtils.hasText(code)) {
            throw new BadRequestException("OAuth authorization code is required");
        }

        final ProviderContext provider = resolveProvider(providerId);
        validateState(state, provider.id());

        final String accessToken = exchangeCodeForAccessToken(provider, code);
        final String email = fetchUserEmail(provider, accessToken);
        final ResolvedIdentity identity = resolveIdentity(email, provider.id());

        final String token = authService.createToken(
                identity.subject(),
                identity.role(),
                identity.firstName(),
                identity.lastName(),
                identity.extraClaims());

        return UriComponentsBuilder
                .fromUriString(oauthProperties.frontendRedirectUrl())
                .fragment("token=" + token)
                .build()
                .toUriString();
    }

    private String exchangeCodeForAccessToken(final ProviderContext provider, final String code) {
        final MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("redirect_uri", callbackUrl(provider.id()));
        form.add("client_id", provider.config().clientId());
        form.add("client_secret", provider.config().clientSecret());

        try {
            @SuppressWarnings("unchecked")
            final Map<String, Object> response = oauthRestClient.post()
                    .uri(provider.config().tokenUrl())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(Map.class);

            if (response == null || !(response.get("access_token") instanceof String accessToken)
                    || !StringUtils.hasText(accessToken)) {
                throw new BadRequestException("OAuth token response missing access_token");
            }
            return accessToken;
        } catch (final RestClientException ex) {
            logger.error("(oauth) Token exchange failed for provider={}", provider.id(), ex);
            throw new BadRequestException("OAuth token exchange failed");
        }
    }

    private String fetchUserEmail(final ProviderContext provider, final String accessToken) {
        try {
            @SuppressWarnings("unchecked")
            final Map<String, Object> userInfo = oauthRestClient.get()
                    .uri(provider.config().userInfoUrl())
                    .headers(headers -> headers.setBearerAuth(accessToken))
                    .retrieve()
                    .body(Map.class);

            if (userInfo == null) {
                throw new BadRequestException("OAuth userinfo response is empty");
            }

            final Object emailValue = userInfo.get("email");
            if (!(emailValue instanceof String email) || !StringUtils.hasText(email)) {
                throw new BadRequestException("OAuth userinfo does not contain email");
            }
            return email.trim().toLowerCase(Locale.ROOT);
        } catch (final RestClientException ex) {
            logger.error("(oauth) Userinfo failed for provider={}", provider.id(), ex);
            throw new BadRequestException("OAuth userinfo request failed");
        }
    }

    private ResolvedIdentity resolveIdentity(final String email, final String providerId) {
        final AppUser user = appUserRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user != null && user.isEnabled() && StringUtils.hasText(user.getRole())) {
            final String username = StringUtils.hasText(user.getUsername())
                    ? user.getUsername()
                    : email;
            return new ResolvedIdentity(
                    username,
                    user.getRole().trim().toLowerCase(Locale.ROOT),
                    user.getFirstName(),
                    user.getLastName(),
                    Map.of("provider", providerId));
        }

        return new ResolvedIdentity(
                email,
                REGISTERME_ROLE,
                null,
                null,
                Map.of("email", email, "provider", providerId));
    }

    private ProviderContext resolveProvider(final String providerId) {
        if (!StringUtils.hasText(providerId)) {
            throw new BadRequestException("OAuth provider is required");
        }
        final String normalized = providerId.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "google" -> new ProviderContext("google", requireProvider(oauthProperties.google(), "google"));
            case "azure", "microsoft" ->
                    new ProviderContext("azure", requireProvider(oauthProperties.azure(), "azure"));
            default -> throw new BadRequestException("Unsupported OAuth provider: " + providerId);
        };
    }

    private OAuthProperties.Provider requireProvider(
            final OAuthProperties.Provider provider,
            final String name) {
        if (provider == null
                || !StringUtils.hasText(provider.clientId())
                || !StringUtils.hasText(provider.clientSecret())
                || !StringUtils.hasText(provider.authorizationUrl())
                || !StringUtils.hasText(provider.tokenUrl())
                || !StringUtils.hasText(provider.userInfoUrl())) {
            throw new BadRequestException("OAuth provider " + name + " is not configured");
        }
        return provider;
    }

    private String callbackUrl(final String providerId) {
        final String base = oauthProperties.backendBaseUrl();
        if (!StringUtils.hasText(base)) {
            throw new BadRequestException("oauth.backend-base-url is not configured");
        }
        return base.replaceAll("/$", "") + "/api/public/oauth/" + providerId + "/callback";
    }

    private String createState(final String providerId) {
        final String nonce = UUID.randomUUID().toString().replace("-", "");
        final long exp = Instant.now().getEpochSecond() + STATE_TTL_SECONDS;
        final String payload = providerId + "|" + exp + "|" + nonce;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8))
                + "."
                + sign(payload);
    }

    private void validateState(final String state, final String expectedProviderId) {
        if (!StringUtils.hasText(state) || !state.contains(".")) {
            throw new BadRequestException("Invalid OAuth state");
        }

        final int separator = state.lastIndexOf('.');
        final String encodedPayload = state.substring(0, separator);
        final String signature = state.substring(separator + 1);

        final String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
        } catch (final IllegalArgumentException ex) {
            throw new BadRequestException("Invalid OAuth state encoding");
        }

        if (!MessageDigest.isEqual(
                sign(payload).getBytes(StandardCharsets.UTF_8),
                signature.getBytes(StandardCharsets.UTF_8))) {
            throw new BadRequestException("Invalid OAuth state signature");
        }

        final String[] parts = payload.split("\\|");
        if (parts.length != 3) {
            throw new BadRequestException("Invalid OAuth state payload");
        }

        if (!expectedProviderId.equals(parts[0])) {
            throw new BadRequestException("OAuth state provider mismatch");
        }

        final long exp;
        try {
            exp = Long.parseLong(parts[1]);
        } catch (final NumberFormatException ex) {
            throw new BadRequestException("Invalid OAuth state expiration");
        }

        if (Instant.now().getEpochSecond() > exp) {
            throw new BadRequestException("OAuth state expired");
        }
    }

    private String sign(final String payload) {
        try {
            final Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(
                    jwtProperties.secret().getBytes(StandardCharsets.UTF_8),
                    "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (final Exception ex) {
            throw new IllegalStateException("Unable to sign OAuth state", ex);
        }
    }

    private record ProviderContext(String id, OAuthProperties.Provider config) {
    }

    private record ResolvedIdentity(
            String subject,
            String role,
            String firstName,
            String lastName,
            Map<String, String> extraClaims
    ) {
    }

}
