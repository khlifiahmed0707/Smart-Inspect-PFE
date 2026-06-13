package com.example.demo.service;

import com.example.demo.entity.Mission;
import com.example.demo.repository.MissionRepository;
import com.example.demo.repository.PersonneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MissionSchedulerService {

    @Autowired
    private MissionRepository missionRepository;

    @Autowired
    private PersonneRepository personneRepository;

    @Autowired
    private NotificationService notificationService;

    /**
     * Runs every 10 seconds.
     * Marks missions as "En retard" ONLY when they first become overdue.
     * Sends ONE notification per mission (transition: not-late → late).
     * The 24h anti-duplicate guard in NotificationService prevents any spam.
     */
    @Scheduled(fixedRate = 10000) // every 10 seconds
    @Transactional
    public void checkOverdueMissions() {
        LocalDateTime now = LocalDateTime.now();
        List<Mission> missions = missionRepository.findAll();

        int markedCount = 0;
        for (Mission mission : missions) {
            String status = mission.getStatut();

            // Skip completed or cancelled missions
            if ("Terminée".equalsIgnoreCase(status) || "Annulée".equalsIgnoreCase(status)) continue;

            // Skip if already marked late (notification already sent)
            if ("En retard".equalsIgnoreCase(status)) continue;

            // Check if deadline has passed
            if (mission.getDateEcheance() != null && mission.getDateEcheance().isBefore(now)) {
                // Mark as overdue
                mission.setStatut("En retard");
                missionRepository.save(mission);
                markedCount++;

                System.out.println("[SCHEDULER] Mission overdue: " + mission.getMissionRef()
                    + " | Inspector: " + mission.getInspecteurEmail());

                // Send ONE notification to the admin + inspector
                sendOverdueNotifications(mission);
            }
        }

        if (markedCount > 0) {
            System.out.println("[SCHEDULER] Marked " + markedCount + " mission(s) as overdue.");
        }
    }

    private void sendOverdueNotifications(Mission mission) {
        // Get inspector name
        String inspectorName = personneRepository.findByEmail(mission.getInspecteurEmail())
            .map(p -> p.getNom() + " " + p.getPrenom())
            .orElse(mission.getInspecteurEmail());

        String missionRef = mission.getMissionRef() != null ? mission.getMissionRef() : "N/A";
        String titre = mission.getTitre() != null ? mission.getTitre() : missionRef;

        // Admin message
        String adminMsg = "🚨 Mission en retard : L'inspecteur [" + inspectorName
            + "] a dépassé l'échéance pour la mission [" + titre + "] (Réf: " + missionRef + ").";

        // Notify ALL admins (uses correct admin tables internally)
        notificationService.notifyAllAdmins(adminMsg, "WARNING");

        // Also notify the specific admin assigned to this mission (if different)
        if (mission.getAdminEmail() != null && !mission.getAdminEmail().isBlank()) {
            notificationService.sendNotification(mission.getAdminEmail(), adminMsg, "WARNING");
        }

        // Notify the inspector
        if (mission.getInspecteurEmail() != null && !mission.getInspecteurEmail().isBlank()) {
            String inspMsg = "⚠️ Votre mission [" + titre + "] (Réf: " + missionRef + ") est en retard. Veuillez agir immédiatement.";
            notificationService.sendNotification(mission.getInspecteurEmail(), inspMsg, "WARNING");
        }
    }
}
