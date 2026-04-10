package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "admin_normal")
public class NormalAdminEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String nom;
    private String prenom;

    @Column(nullable = false)
    private boolean isFirstLogin = true;

    /**
     * Stores the facial embedding vector as a JSON-serialized array string.
     * Example: "[0.12, 0.45, -0.33, ...]"
     * Null until the admin completes biometric enrollment on first login.
     */
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String faceVector;

    @Column(nullable = false)
    private String role = "ADMIN_NORMAL";

    // New Fields for Profile Completeness
    private String telephone;
    private String adresse;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photo;

    @Column(nullable = false)
    private boolean enabled = true;

    // --- Constructors ---
    public NormalAdminEntity() {}

    public NormalAdminEntity(String email, String password, String nom, String prenom) {
        this.email = email;
        this.password = password;
        this.nom = nom;
        this.prenom = prenom;
        this.isFirstLogin = true;
        this.role = "ADMIN_NORMAL";
    }

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public boolean isFirstLogin() { return isFirstLogin; }
    public void setFirstLogin(boolean firstLogin) { isFirstLogin = firstLogin; }

    public String getFaceVector() { return faceVector; }
    public void setFaceVector(String faceVector) { this.faceVector = faceVector; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
}
