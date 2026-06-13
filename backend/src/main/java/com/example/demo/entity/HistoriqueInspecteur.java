package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historique_inspecteur")
public class HistoriqueInspecteur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "id_inspection", unique = true, nullable = false)
    private String idInspection;

    @Column(name = "nom_piece")
    private String nomPiece;

    @Column(name = "taux_confiance")
    private Double tauxConfiance;

    @Column(name = "anomalie", length = 500)
    private String anomalie;

    @Column(name = "resultat")
    private String resultat; // "CONFORME" ou "NON CONFORME"

    @Column(name = "temps_analyse")
    private String tempsAnalyse;

    @Column(name = "date_inspection")
    private LocalDateTime dateInspection;

    @Column(name = "image_data", columnDefinition = "LONGTEXT")
    private String imageData; // Base64 image

    @Column(name = "inspecteur_email")
    private String inspecteurEmail;

    @Column(name = "inspecteur_nom")
    private String inspecteurNom;

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIdInspection() { return idInspection; }
    public void setIdInspection(String idInspection) { this.idInspection = idInspection; }

    public String getNomPiece() { return nomPiece; }
    public void setNomPiece(String nomPiece) { this.nomPiece = nomPiece; }

    public Double getTauxConfiance() { return tauxConfiance; }
    public void setTauxConfiance(Double tauxConfiance) { this.tauxConfiance = tauxConfiance; }

    public String getAnomalie() { return anomalie; }
    public void setAnomalie(String anomalie) { this.anomalie = anomalie; }

    public String getResultat() { return resultat; }
    public void setResultat(String resultat) { this.resultat = resultat; }

    public String getTempsAnalyse() { return tempsAnalyse; }
    public void setTempsAnalyse(String tempsAnalyse) { this.tempsAnalyse = tempsAnalyse; }

    public LocalDateTime getDateInspection() { return dateInspection; }
    public void setDateInspection(LocalDateTime dateInspection) { this.dateInspection = dateInspection; }

    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }

    public String getInspecteurEmail() { return inspecteurEmail; }
    public void setInspecteurEmail(String inspecteurEmail) { this.inspecteurEmail = inspecteurEmail; }

    public String getInspecteurNom() { return inspecteurNom; }
    public void setInspecteurNom(String inspecteurNom) { this.inspecteurNom = inspecteurNom; }
}
