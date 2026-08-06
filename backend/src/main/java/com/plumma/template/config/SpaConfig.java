package com.plumma.template.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnResource;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Serve la Single Page Application React (compilata dentro {@code classpath:/static/})
 * facendo fallback su {@code index.html} per le rotte lato client, ma lasciando
 * passare le API ({@code /api/**}, {@code /services/**}).
 *
 * <p>Attivo solo quando la {@code index.html} del frontend e' presente nel WAR
 * (vedi copia del modulo frontend in fase di build).</p>
 */
@Configuration
@ConditionalOnResource(resources = "classpath:/static/index.html")
public class SpaConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(final ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(final String resourcePath, final Resource location)
                            throws IOException {
                        final Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        if (resourcePath.startsWith("api/")
                                || resourcePath.startsWith("services/")) {
                            return null;
                        }
                        if (resourcePath.contains(".") && !resourcePath.endsWith(".html")) {
                            return null;
                        }
                        return location.createRelative("index.html");
                    }
                });
    }

}
