package com.example.demo.service;

import com.example.demo.entity.AdminEntity;
import com.example.demo.entity.NormalAdminEntity;
import com.example.demo.entity.Notification;
import com.example.demo.repository.AdminRepository;
import com.example.demo.repository.NormalAdminRepository;
import com.example.demo.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NormalAdminRepository normalAdminRepository;

    @Autowired
    private AdminRepository superAdminRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Collects emails from BOTH admin tables (super_admin + admin_normal).
     * This is the REAL source of truth for admin emails.
     */
    public List<String> getAllAdminEmails() {
        List<String> emails = new ArrayList<>();
        // Super Admins (table: super_admin)
        superAdminRepository.findAll().forEach(a -> {
            if (a.getEmail() != null) emails.add(a.getEmail().toLowerCase().trim());
        });
        // Normal Admins (table: admin_normal)
        normalAdminRepository.findAll().forEach(a -> {
            if (a.getEmail() != null && a.isEnabled()) {
                emails.add(a.getEmail().toLowerCase().trim());
            }
        });
        return emails;
    }

    /** Sends a notification to a single user (no image). */
    public void sendNotification(String userEmail, String message, String type) {
        sendNotification(userEmail, message, type, null);
    }

    /** Sends a notification to ALL admins at once (with optional image). */
    public void notifyAllAdmins(String message, String type, String relatedImage) {
        List<String> adminEmails = getAllAdminEmails();
        System.out.println("[NOTIF] Broadcasting to " + adminEmails.size() + " admin(s): " + adminEmails);
        for (String email : adminEmails) {
            sendNotification(email, message, type, relatedImage);
        }
    }

    /** Sends a notification to ALL admins (no image). */
    public void notifyAllAdmins(String message, String type) {
        notifyAllAdmins(message, type, null);
    }

    /** Core method: saves to DB + pushes via WebSocket. Anti-duplicate guard included. */
    public void sendNotification(String userEmail, String message, String type, String relatedImage) {
        if (userEmail == null || userEmail.isBlank()) {
            System.err.println("[NOTIF SKIP] Null/blank email.");
            return;
        }

        String normalizedEmail = userEmail.toLowerCase().trim();

        try {
            // ── Anti-Duplicate Guard ──
            // For WARNING (delays): 24h window — prevent scheduler spam
            // For DANGER/INFO: 10s window — allow rapid anomaly notifications
            int deduplicateSeconds = "WARNING".equals(type) ? 86400 : 10;
            LocalDateTime since = LocalDateTime.now().minusSeconds(deduplicateSeconds);

            List<Notification> recent = notificationRepository.findRecentByEmailAndMessage(
                normalizedEmail, message, since
            );
            if (!recent.isEmpty()) {
                System.out.println("[NOTIF DEDUP] Skipped duplicate (" + type + ") for: " + normalizedEmail);
                return;
            }

            // ── Save to DB ──
            Notification notif = new Notification(normalizedEmail, message, type, relatedImage);
            notificationRepository.save(notif);
            System.out.println("[NOTIF ✓] " + type + " → " + normalizedEmail + " | " +
                message.substring(0, Math.min(80, message.length())));

            // ── WebSocket Push (real-time, zero latency) ──
            if (messagingTemplate != null) {
                String topic = "/topic/notifications/" + normalizedEmail.replace(".", "_dot_").replace("@", "_at_");
                messagingTemplate.convertAndSend(topic, notif);
            }
        } catch (Exception e) {
            System.err.println("[NOTIF ERROR] " + e.getMessage());
        }
    }
}
