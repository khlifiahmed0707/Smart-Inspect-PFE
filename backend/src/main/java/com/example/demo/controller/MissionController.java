package com.example.demo.controller;

import com.example.demo.entity.Mission;
import com.example.demo.entity.Personne;
import com.example.demo.repository.MissionRepository;
import com.example.demo.repository.PersonneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/missions")
@CrossOrigin(origins = "*")
public class MissionController {

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private PersonneRepository personneRepository;

    @Autowired
    private com.example.demo.service.NotificationService notificationService;



    // ── GET /api/missions/all ──
    @GetMapping("/all")
    public ResponseEntity<List<Map<String, Object>>> getAllMissions(@RequestParam(required = false) String adminEmail) {
        List<Mission> missions = missionRepository.findAllByOrderByCreatedAtDesc();
        
        // Auto-fix: If missions don't have an adminEmail, assign the current admin to them
        if (adminEmail != null && !adminEmail.isBlank()) {
            boolean changed = false;
            for (Mission m : missions) {
                if (m.getAdminEmail() == null || m.getAdminEmail().isBlank()) {
                    m.setAdminEmail(adminEmail);
                    changed = true;
                }
            }
            if (changed) missionRepository.saveAll(missions);
        }


        return ResponseEntity.ok(toMapList(missions));
    }

    // ── GET /api/missions/my-missions?email=xxx ──
    @GetMapping("/my-missions")
    public ResponseEntity<List<Map<String, Object>>> getMyMissions(@RequestParam String email) {
        List<Mission> missions = missionRepository.findByInspecteurEmailOrderByCreatedAtDesc(email);

        return ResponseEntity.ok(toMapList(missions));
    }

    // ── GET /api/missions/stats ──
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {

        Map<String, Object> stats = new HashMap<>();
        stats.put("enCours", missionRepository.countByStatut("En cours"));
        stats.put("terminees", missionRepository.countByStatut("Terminée"));
        stats.put("annulees", missionRepository.countByStatut("Annulée"));
        stats.put("enRetard", missionRepository.countByStatut("En retard"));
        stats.put("total", missionRepository.count());
        return ResponseEntity.ok(stats);
    }

    // ── POST /api/missions ──
    @PostMapping
    public ResponseEntity<Map<String, Object>> createMission(@RequestBody Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();
        try {
            String email = (String) payload.get("inspecteurEmail");
            if (email == null || email.isBlank()) {
                response.put("success", false);
                response.put("message", "Email requis.");
                return ResponseEntity.status(400).body(response);
            }

            Optional<Personne> opt = personneRepository.findByEmail(email.toLowerCase().trim());
            if (opt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Email non trouvé dans la base.");
                return ResponseEntity.status(404).body(response);
            }

            // Parse dateEcheance (ISO format: "2026-05-07T18:00")
            String dateStr = (String) payload.get("dateEcheance");
            LocalDateTime echeance = null;
            if (dateStr != null && !dateStr.isBlank()) {
                try {
                    if (dateStr.length() == 16) {
                        echeance = LocalDateTime.parse(dateStr, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));
                    } else {
                        echeance = LocalDateTime.parse(dateStr);
                    }
                    // Validate: not in the past
                    if (echeance.isBefore(LocalDateTime.now())) {
                        response.put("success", false);
                        response.put("message", "La date ou l'heure ne peut pas être dans le passé.");
                        return ResponseEntity.status(400).body(response);
                    }
                } catch (Exception e) {
                    response.put("success", false);
                    response.put("message", "Format de date invalide. Utilisez YYYY-MM-DDTHH:mm");
                    return ResponseEntity.status(400).body(response);
                }
            }

            Mission mission = new Mission();
            mission.setInspecteurEmail(email.toLowerCase().trim());
            mission.setAdminEmail((String) payload.get("adminEmail"));
            mission.setPieceAttendue((String) payload.get("pieceAttendue"));
            mission.setTitre((String) payload.getOrDefault("pieceAttendue", "Mission"));
            mission.setPriorite((String) payload.getOrDefault("priorite", "Normale"));
            mission.setDateEcheance(echeance);
            mission.setStatut("En cours");

            String ref = "MSN-" + (System.currentTimeMillis() % 100000) + "-"
                    + (char) ('A' + new Random().nextInt(26));
            mission.setMissionRef(ref);

            Mission saved = missionRepository.save(mission);

            // Trigger Notification (Real-time)
            notificationService.sendNotification(
                saved.getInspecteurEmail(),
                "Une nouvelle mission vous a été assignée : [" + saved.getTitre() + "]",
                "INFO"
            );

            response.put("success", true);
            response.put("message", "Mission assignée !");
            response.put("mission", toMap(saved));
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Erreur : " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    // ── GET /api/missions/verify-inspecteur?email=xxx ──
    @GetMapping("/verify-inspecteur")
    public ResponseEntity<Map<String, Object>> verifyInspecteur(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();
        Optional<Personne> opt = personneRepository.findByEmail(email.toLowerCase().trim());

        if (opt.isPresent()) {
            Personne p = opt.get();
            response.put("valid", true);
            response.put("nom", p.getPrenom() + " " + p.getNom());
            response.put("photo", p.getPhoto() != null ? p.getPhoto() : "");
        } else {
            response.put("valid", false);
            response.put("message", "Erreur Erreur email incorrect");
        }
        return ResponseEntity.ok(response);
    }

    // ── PATCH /api/missions/{id}/complete ──
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Map<String, Object>> completeMission(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        Optional<Mission> opt = missionRepository.findById(id);
        if (opt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Mission non trouvée.");
            return ResponseEntity.status(404).body(response);
        }
        Mission mission = opt.get();
        mission.setStatut("Terminée");
        missionRepository.save(mission);
        response.put("success", true);
        response.put("message", "Mission marquée comme Terminée.");
        return ResponseEntity.ok(response);
    }

    // ── DELETE /api/missions/{id} ──
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteMission(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        if (!missionRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "Mission non trouvée.");
            return ResponseEntity.status(404).body(response);
        }
        missionRepository.deleteById(id);
        response.put("success", true);
        response.put("message", "Mission supprimée.");
        return ResponseEntity.ok(response);
    }

    // ── GET /api/missions/inspecteurs ──
    @GetMapping("/inspecteurs")
    public ResponseEntity<List<Map<String, Object>>> getInspecteurs() {
        List<Personne> all = personneRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Personne p : all) {
            if (p.isEnabled()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("email", p.getEmail());
                m.put("nom", p.getNom());
                m.put("prenom", p.getPrenom());
                m.put("photo", p.getPhoto() != null ? p.getPhoto() : "");
                result.add(m);
            }
        }
        return ResponseEntity.ok(result);
    }

    // ── Helper: Mission → Map ──
    private Map<String, Object> toMap(Mission m) {
        DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("dd MMM, HH:mm", Locale.FRENCH);
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", m.getId());
        map.put("missionRef", m.getMissionRef());
        map.put("titre", m.getTitre());
        map.put("description", m.getDescription());
        map.put("pieceAttendue", m.getPieceAttendue());
        map.put("priorite", m.getPriorite());
        map.put("statut", m.getStatut());
        map.put("inspecteurEmail", m.getInspecteurEmail());
        map.put("adminEmail", m.getAdminEmail());
        map.put("dateEcheance", m.getDateEcheance() != null ? m.getDateEcheance().format(dateFmt) : null);
        map.put("heureEcheance", m.getDateEcheance() != null ? m.getDateEcheance().format(timeFmt) : null);
        map.put("echeanceIso", m.getDateEcheance() != null ? m.getDateEcheance().toString() : null);
        map.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().format(dtFmt) : null);
        // Enrich with inspector info
        if (m.getInspecteurEmail() != null) {
            personneRepository.findByEmail(m.getInspecteurEmail().toLowerCase().trim()).ifPresent(p -> {
                map.put("inspecteurNom", p.getPrenom() + " " + p.getNom());
                map.put("inspecteurPhoto", p.getPhoto() != null ? p.getPhoto() : "");
            });
        }
        return map;
    }

    private List<Map<String, Object>> toMapList(List<Mission> missions) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Mission m : missions) result.add(toMap(m));
        return result;
    }
}
