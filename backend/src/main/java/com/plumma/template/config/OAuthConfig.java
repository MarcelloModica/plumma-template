package com.plumma.template.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(OAuthProperties.class)
public class OAuthConfig {

    @Bean
    RestClient oauthRestClient(final RestClient.Builder restClientBuilder) {
        return restClientBuilder.build();
    }

}
