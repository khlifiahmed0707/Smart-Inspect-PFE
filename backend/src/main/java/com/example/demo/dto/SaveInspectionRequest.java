package com.example.demo.dto;

public class SaveInspectionRequest {
    private String nomPiece;
    private Double tauxConfiance;
    private String anomalie;
    private String resultat;
    private String tempsAnalyse;
    private String imageData;
    private String inspecteurEmail;
    private String inspecteurNom;
    private Long missionId; // Link inspection to the originating mission

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

    public String getImageData() { return imageData; }
    public void setImageData(String imageData) { this.imageData = imageData; }

    public String getInspecteurEmail() { return inspecteurEmail; }
    public void setInspecteurEmail(String inspecteurEmail) { this.inspecteurEmail = inspecteurEmail; }

    public String getInspecteurNom() { return inspecteurNom; }
    public void setInspecteurNom(String inspecteurNom) { this.inspecteurNom = inspecteurNom; }

    public Long getMissionId() { return missionId; }
    public void setMissionId(Long missionId) { this.missionId = missionId; }
}
