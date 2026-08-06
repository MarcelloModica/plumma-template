package com.plumma.template;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

/**
 * Abilita il deploy come WAR su un servlet container esterno (Tomcat di
 * Elastic Beanstalk), oltre all'esecuzione come JAR standalone in locale.
 */
public class ServletInitializer extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(final SpringApplicationBuilder application) {
        return application.sources(PlummaTemplateApplication.class);
    }

}
