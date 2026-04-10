package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "super_admin")
public class AdminEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String nom;
    private String prenom;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photo;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String faceVector;

    @Column(nullable = false)
    private String role = "SUPER_ADMIN";

    // Standard Default Constructor
    public AdminEntity() {}

    // Constructor with All Fields (Optional but helpful)
    public AdminEntity(Long id, String email, String password, String nom, String prenom, String photo, String role, String faceVector) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.nom = nom;
        this.prenom = prenom;
        this.photo = photo;
        this.role = role;
        this.faceVector = faceVector;
    }

    // Getters and Setters
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

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getFaceVector() { return faceVector; }
    public void setFaceVector(String faceVector) { this.faceVector = faceVector; }
}
