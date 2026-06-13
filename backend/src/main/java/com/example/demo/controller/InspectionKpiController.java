package com.example.demo.controller;

import com.example.demo.entity.HistoriqueInspecteur;
import com.example.demo.repository.HistoriqueInspecteurRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;
import java.util.Objects;

@RestController
@RequestMapping("/api/inspections")
@CrossOrigin(origins = "*")
public class InspectionKpiController {

    @Autowired
    private HistoriqueInspecteurRepository repository;

    // ---------------------------------------------------------------
    // GET /api/inspections/kpi?email=xxx — KPIs for one inspector
    // ---------------------------------------------------------------
    @GetMapping("/kpi")
    public ResponseEntity<Map<String, Object>> getKpi(@RequestParam String email) {
        // Fetch ALL records (no page limit) for aggregation
        List<HistoriqueInspecteur> all = repository
            .findByInspecteurEmailOrderByDateInspectionDesc(email, PageRequest.of(0, Integer.MAX_VALUE))
            .getContent();

        long total = all.size();
        long conformes = all.stream().filter(e -> "CONFORME".equalsIgnoreCase(e.getResultat())).count();
        long nonConformes = total - conformes;

        double avgConformity = total > 0 ? (conformes * 100.0 / total) : 0;

        // Average analysis time (parse "0.123s" → double)
        OptionalDouble avgTime = all.stream()
            .map(HistoriqueInspecteur::getTempsAnalyse)
            .filter(t -> t != null && !t.isEmpty())
            .mapToDouble(t -> {
                try { return Double.parseDouble(t.replace("s", "").trim()); }
                catch (NumberFormatException e) { return 0.0; }
            })
            .average();

        // Average confidence rate (already Double in entity)
        OptionalDouble avgConfidence = all.stream()
            .map(HistoriqueInspecteur::getTauxConfiance)
            .filter(Objects::nonNull)
            .mapToDouble(Double::doubleValue)
            .average();

        // --- Chart 1: global summary ---
        Map<String, Object> globalRow = new LinkedHashMap<>();
        globalRow.put("name", "Total Global");
        globalRow.put("conforme", conformes);
        globalRow.put("nonConforme", nonConformes);
        List<Map<String, Object>> globalSummary = List.of(globalRow);

        // --- Chart 2: by piece name ---
        Map<String, long[]> byPiece = new LinkedHashMap<>();
        for (HistoriqueInspecteur e : all) {
            String piece = cleanPieceName(e.getNomPiece());
            
            // Only aggregate the two main types as requested
            if (!piece.equals("Carte de Control Wifi") && !piece.equals("Carte De Command De Puissance")) {
                continue;
            }

            byPiece.computeIfAbsent(piece, k -> new long[]{0, 0});
            if ("CONFORME".equalsIgnoreCase(e.getResultat())) byPiece.get(piece)[0]++;
            else byPiece.get(piece)[1]++;
        }
        
        List<Map<String, Object>> pieceDetails = byPiece.entrySet().stream().map(entry -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", entry.getKey());
            row.put("conforme", entry.getValue()[0]);
            row.put("nonConforme", entry.getValue()[1]);
            row.put("total", entry.getValue()[0] + entry.getValue()[1]);
            return row;
        }).collect(Collectors.toList());

        // --- Full history for export (without image blobs) ---
        List<Map<String, Object>> exportRows = all.stream().map(e -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", e.getIdInspection());
            row.put("pieceName", cleanPieceName(e.getNomPiece()));
            row.put("resultat", e.getResultat());
            row.put("anomalie", e.getAnomalie());
            row.put("tauxConfiance", e.getTauxConfiance());
            row.put("tempsAnalyse", e.getTempsAnalyse());
            row.put("date", e.getDateInspection() != null ? e.getDateInspection().toString() : "");
            return row;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("totalAnalyzed", total);
        response.put("conformes", conformes);
        response.put("nonConformes", nonConformes);
        response.put("avgConformity", Math.round(avgConformity * 10.0) / 10.0);
        response.put("avgTime", avgTime.isPresent() ? String.format("%.2fs", avgTime.getAsDouble()) : "N/A");
        response.put("avgConfidence", avgConfidence.isPresent() ? String.format("%.1f%%", avgConfidence.getAsDouble()) : "0%");
        response.put("globalSummary", globalSummary);
        response.put("pieceDetails", pieceDetails);
        response.put("exportRows", exportRows);

        return ResponseEntity.ok(response);
    }

    private String cleanPieceName(String rawName) {
        if (rawName == null) return "Inconnu";
        
        // Remove trailing underscores and other special chars
        String piece = rawName.replaceAll("[^a-zA-Z0-9 ]+$", "").trim();
        
        // Normalize common labels
        if (piece.toLowerCase().contains("wifi")) return "Carte de Control Wifi";
        if (piece.toLowerCase().contains("puissance") || piece.toLowerCase().contains("command")) return "Carte De Command De Puissance";
        
        return piece;
    }
}
