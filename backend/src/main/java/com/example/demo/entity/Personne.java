package com.example.demo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "new_register")
public class Personne {

    @EmbeddedId
    private PersonneId id;

    private String nom;
    private String prenom;
    private String password;
    private boolean enabled = false;

    private String telephone;
    private String adresse;
    private String role = "USER";
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photo;

    public Personne() {}

    public Personne(String email, String nom, String prenom, String password, String numeroCarteIdentite) {
        this.id = new PersonneId(email, numeroCarteIdentite);
        this.nom = nom;
        this.prenom = prenom;
        this.password = password;
    }

    public PersonneId getId() { return id; }
    public void setId(PersonneId id) { this.id = id; }

    public String getEmail() { return id != null ? id.getEmail() : null; }
    public void setEmail(String email) { 
        if (this.id == null) this.id = new PersonneId();
        this.id.setEmail(email); 
    }

    public String getNumeroCarteIdentite() { return id != null ? id.getNumeroCarteIdentite() : null; }
    public void setNumeroCarteIdentite(String cin) { 
        if (this.id == null) this.id = new PersonneId();
        this.id.setNumeroCarteIdentite(cin); 
    }

    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }

    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getTelephone() { return telephone; }
    public void setTelephone(String telephone) { this.telephone = telephone; }

    public String getAdresse() { return adresse; }
    public void setAdresse(String adresse) { this.adresse = adresse; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getPhoto() { return photo; }
    public void setPhoto(String photo) { this.photo = photo; }
}
