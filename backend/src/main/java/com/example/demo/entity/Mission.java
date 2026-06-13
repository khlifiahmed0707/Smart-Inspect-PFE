package com.example.demo.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "missions")
public class Mission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "piece_attendue")
    private String pieceAttendue; // Exact piece name for conformity check

    @Column(name = "date_echeance")
    private LocalDateTime dateEcheance;

    @Column(nullable = false)
    private String priorite = "Normale"; // Basse, Normale, Haute

    @Column(nullable = false)
    private String statut = "En cours"; // En cours, Terminée, Annulée, En retard

    @Column(name = "inspecteur_email")
    private String inspecteurEmail;

    @Column(name = "admin_email")
    private String adminEmail;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "mission_ref")
    private String missionRef; // e.g. "MSN-901-P"

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPieceAttendue() { return pieceAttendue; }
    public void setPieceAttendue(String pieceAttendue) { this.pieceAttendue = pieceAttendue; }

    public LocalDateTime getDateEcheance() { return dateEcheance; }
    public void setDateEcheance(LocalDateTime dateEcheance) { this.dateEcheance = dateEcheance; }

    public String getPriorite() { return priorite; }
    public void setPriorite(String priorite) { this.priorite = priorite; }

    public String getStatut() { return statut; }
    public void setStatut(String statut) { this.statut = statut; }

    public String getInspecteurEmail() { return inspecteurEmail; }
    public void setInspecteurEmail(String inspecteurEmail) { this.inspecteurEmail = inspecteurEmail; }

    public String getAdminEmail() { return adminEmail; }
    public void setAdminEmail(String adminEmail) { this.adminEmail = adminEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getMissionRef() { return missionRef; }
    public void setMissionRef(String missionRef) { this.missionRef = missionRef; }
}
