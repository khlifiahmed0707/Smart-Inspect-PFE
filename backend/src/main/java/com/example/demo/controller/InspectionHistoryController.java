package com.example.demo.controller;

import com.example.demo.dto.SaveInspectionRequest;
import com.example.demo.entity.HistoriqueInspecteur;
import com.example.demo.repository.HistoriqueInspecteurRepository;
import com.example.demo.repository.MissionRepository;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/inspections")
@CrossOrigin(origins = "*")
public class InspectionHistoryController {

    @Autowired
    private HistoriqueInspecteurRepository repository;

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private NotificationService notificationService;

    // ── GET: Global inspection count (for admin dashboard) ──
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getTotalCount() {
        long total = repository.count();
        long conformes = repository.countByResultat("CONFORME");
        long nonConformes = repository.countByResultat("NON CONFORME");
        return ResponseEntity.ok(Map.of(
            "count", total,
            "conformes", conformes,
            "nonConformes", nonConformes
        ));
    }




    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> saveInspection(@RequestBody SaveInspectionRequest req) {
        Map<String, Object> response = new HashMap<>();
        try {
            // ── 1. Build and save inspection entry ──
            HistoriqueInspecteur entry = new HistoriqueInspecteur();
            String prefix = generatePrefix(req.getNomPiece());
            String uniqueId = prefix + "-" + System.currentTimeMillis() % 100000;
            entry.setIdInspection(uniqueId);
            entry.setNomPiece(req.getNomPiece());
            entry.setTauxConfiance(req.getTauxConfiance());
            entry.setAnomalie(req.getAnomalie());
            entry.setResultat(req.getResultat());
            entry.setTempsAnalyse(req.getTempsAnalyse());
            entry.setDateInspection(LocalDateTime.now());
            entry.setInspecteurEmail(req.getInspecteurEmail());
            entry.setInspecteurNom(req.getInspecteurNom());

            // Ne pas tronquer l'image car cela corrompt le Base64 !
            String img = req.getImageData();
            entry.setImageData(img);

            repository.save(entry);
            System.out.println("[INSPECTION] Saved: " + uniqueId + " | " + req.getNomPiece() + " | " + req.getResultat());

            // ── 2. Auto-complete linked mission ──
            if (req.getMissionId() != null) {
                missionRepository.findById(req.getMissionId()).ifPresent(m -> {
                    m.setStatut("Terminée");
                    missionRepository.save(m);
                    System.out.println("[MISSION] Auto-completed: " + m.getMissionRef());
                });
            }

            // ── 3. Fire notifications based on result ──
            String anomalie = req.getAnomalie();
            boolean hasAnomaly = anomalie != null
                && !anomalie.isBlank()
                && !anomalie.equalsIgnoreCase("Aucune (OK)")
                && !anomalie.equalsIgnoreCase("Aucune")
                && !anomalie.equalsIgnoreCase("OK");

            // ✅ CRITICAL: Always normalize inspecteur email to lowercase to ensure
            // notifications go to the exact right user — prevents cross-user contamination
            String inspecteurEmailNorm = (req.getInspecteurEmail() != null)
                ? req.getInspecteurEmail().toLowerCase().trim()
                : null;

            if (inspecteurEmailNorm == null || inspecteurEmailNorm.isBlank()) {
                System.err.println("[NOTIF SKIP] inspecteurEmail is null/blank — skipping notifications.");
            } else if (hasAnomaly) {
                // Parse multiple anomalies separated by comma
                String[] parts = anomalie.replace("[", "").replace("]", "").split(",");
                for (String part : parts) {
                    String cleanAnomaly = part.trim();
                    if (cleanAnomaly.isEmpty()) continue;

                    // Notify ONLY the inspector who performed this inspection
                    String inspMsg = "Anomalie Détectée : [" + cleanAnomaly + "] sur [" + req.getNomPiece() + "].";
                    System.out.println("[NOTIF] Sending inspector anomaly notification to: " + inspecteurEmailNorm);
                    notificationService.sendNotification(inspecteurEmailNorm, inspMsg, "DANGER");

                    // Notify ALL admins (admin format - clearly distinct from inspector format)
                    String adminMsg = "[ADMIN] Anomalie : [" + cleanAnomaly + "] détectée par ["
                        + req.getInspecteurNom() + "] sur [" + req.getNomPiece() + "].";
                    notificationService.notifyAllAdmins(adminMsg, "DANGER", req.getImageData());
                }
            } else if ("CONFORME".equalsIgnoreCase(req.getResultat())) {
                // Light success notification for admins only (never sent to inspectors)
                String msg = "Pièce Validée : [" + req.getNomPiece() + "] inspectée par " + req.getInspecteurNom() + " — Conforme.";
                notificationService.notifyAllAdmins(msg, "INFO", req.getImageData());
            }

            response.put("success", true);
            response.put("message", "Inspection enregistrée avec succès !");
            response.put("id", uniqueId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("[INSPECTION ERROR] " + e.getMessage());
            response.put("success", false);
            response.put("message", "Erreur : " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory(
            @RequestParam String email,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {

        org.springframework.data.domain.Pageable pageable =
            org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<HistoriqueInspecteur> pageResult =
            repository.findByInspecteurEmailOrderByDateInspectionDesc(email, pageable);

        List<Map<String, Object>> list = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm", Locale.FRENCH);

        for (HistoriqueInspecteur e : pageResult.getContent()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", e.getIdInspection());
            row.put("pieceName", e.getNomPiece());
            row.put("date", e.getDateInspection() != null ? e.getDateInspection().format(fmt) : "");
            row.put("confidence", e.getTauxConfiance() != null ? e.getTauxConfiance() : 0);
            row.put("status", "NON CONFORME".equals(e.getResultat()) ? "NON-CONFORME" : "CONFORME");
            row.put("anomalyType", e.getAnomalie());
            row.put("time", e.getTempsAnalyse());
            row.put("img", e.getImageData() != null ? e.getImageData() : "");
            list.add(row);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", list);
        response.put("currentPage", pageResult.getNumber());
        response.put("totalItems", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());
        return ResponseEntity.ok(response);
    }

    private String generatePrefix(String nomPiece) {
        if (nomPiece == null) return "INS";
        String lower = nomPiece.toLowerCase();
        if (lower.contains("wifi")) return "CW";
        if (lower.contains("puissance")) return "CP";
        return "INS";
    }
}
