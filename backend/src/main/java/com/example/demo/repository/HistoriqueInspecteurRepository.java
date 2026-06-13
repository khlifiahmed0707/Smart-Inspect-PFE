package com.example.demo.repository;

import com.example.demo.entity.HistoriqueInspecteur;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoriqueInspecteurRepository extends JpaRepository<HistoriqueInspecteur, Long> {
    Page<HistoriqueInspecteur> findByInspecteurEmailOrderByDateInspectionDesc(String email, Pageable pageable);
    long countByResultat(String resultat);
    void deleteByInspecteurEmail(String email);
    void deleteByInspecteurNom(String nom);
}
