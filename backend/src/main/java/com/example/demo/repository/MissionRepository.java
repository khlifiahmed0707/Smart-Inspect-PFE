package com.example.demo.repository;

import com.example.demo.entity.Mission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MissionRepository extends JpaRepository<Mission, Long> {
    List<Mission> findByInspecteurEmailOrderByCreatedAtDesc(String email);
    List<Mission> findAllByOrderByCreatedAtDesc();
    List<Mission> findAllByStatut(String statut);
    long countByStatut(String statut);
}
