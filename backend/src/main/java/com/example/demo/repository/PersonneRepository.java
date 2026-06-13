package com.example.demo.repository;

import com.example.demo.entity.Personne;
import com.example.demo.entity.PersonneId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PersonneRepository extends JpaRepository<Personne, PersonneId> {
    @Query("SELECT p FROM Personne p WHERE p.id.email = :email")
    Optional<Personne> findByEmail(@Param("email") String email);
    
    Optional<Personne> findByIdNumeroCarteIdentite(String numeroCarteIdentite);
    
    java.util.List<Personne> findAllByRoleIn(java.util.List<String> roles);
    
    long countByRole(String role);
}
