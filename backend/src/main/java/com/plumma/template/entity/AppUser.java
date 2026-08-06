package com.plumma.template.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Utente applicativo persistito su DB.
 *
 * <p>Il login username/password valida {@code passwordHash}; il login OAuth
 * (Google / Microsoft 365) risolve l'utente per {@code email}. Al primo avvio,
 * se la tabella e' vuota, viene creato l'utente demo definito nelle properties
 * ({@code app.demo-user.*}).</p>
 */
@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    /** Usata per risolvere l'identita' negli accessi OAuth. */
    @Column(unique = true)
    private String email;

    /** Hash BCrypt della password; null per utenti solo-OAuth. */
    @Column(name = "password_hash")
    private String passwordHash;

    @Column(nullable = false)
    private String role;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(nullable = false)
    private boolean enabled = true;

}
