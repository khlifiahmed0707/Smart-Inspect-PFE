package com.example.demo.controller;

import com.example.demo.entity.Notification;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    // ── GET: All notifications for a user (newest first) ──
    @GetMapping
    public List<Notification> getNotifications(@RequestParam String email) {
        return notificationRepository.findByUserEmailOrderByCreatedAtDesc(email.toLowerCase().trim());
    }

    // ── GET: Unread count ──
    @GetMapping("/unread-count")
    public long getUnreadCount(@RequestParam String email) {
        return notificationRepository.countByUserEmailAndIsReadFalse(email.toLowerCase().trim());
    }

    // ── PATCH: Mark single notification as read ──
    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Optional<Notification> opt = notificationRepository.findById(id);
        if (opt.isPresent()) {
            Notification n = opt.get();
            n.setRead(true);
            notificationRepository.save(n);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.notFound().build();
    }

    // ── DELETE: Hard Reset — permanently deletes ALL notifications for a user ──
    @DeleteMapping("/clear")
    @Transactional
    public ResponseEntity<?> clearAll(@RequestParam String email) {
        String normalizedEmail = email.toLowerCase().trim();
        try {
            long countBefore = notificationRepository.countByUserEmailAndIsReadFalse(normalizedEmail);
            notificationRepository.deleteByUserEmail(normalizedEmail);
            notificationRepository.flush();
            long countAfter = notificationRepository.findByUserEmailOrderByCreatedAtDesc(normalizedEmail).size();

            System.out.println("[CLEAR] Deleted notifications for " + normalizedEmail
                + " | Before: " + countBefore + " | Remaining: " + countAfter);

            // Push WebSocket event so all browser tabs update instantly
            if (messagingTemplate != null) {
                String topic = "/topic/notifications/" + normalizedEmail.replace(".", "_dot_").replace("@", "_at_");
                messagingTemplate.convertAndSend(topic, Map.of("action", "CLEARED"));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Notifications supprimées définitivement.",
                "deleted", countBefore
            ));
        } catch (Exception e) {
            System.err.println("[CLEAR ERROR] " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // ── DELETE: Remove single notification ──
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteOne(@PathVariable Long id) {
        if (notificationRepository.existsById(id)) {
            notificationRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("success", true));
        }
        return ResponseEntity.notFound().build();
    }

    // ── POST: Manual test trigger ──
    @PostMapping("/test")
    public ResponseEntity<?> testNotification(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String message = body.getOrDefault("message", "🔔 Test Notification OK!");
        String type = body.getOrDefault("type", "INFO");
        if (email != null && !email.isBlank()) {
            notificationService.sendNotification(email.toLowerCase().trim(), message, type);
            return ResponseEntity.ok(Map.of("success", true, "sentTo", email));
        }
        return ResponseEntity.badRequest().body(Map.of("error", "Email requis."));
    }

    // ── POST: Send to ALL admins (debug/admin action) ──
    @PostMapping("/notify-admins")
    public ResponseEntity<?> notifyAdmins(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "📢 Message admin de test.");
        String type = body.getOrDefault("type", "INFO");
        List<String> adminEmails = notificationService.getAllAdminEmails();
        adminEmails.forEach(e -> notificationService.sendNotification(e, message, type));
        return ResponseEntity.ok(Map.of("success", true, "notified", adminEmails.size(), "emails", adminEmails));
    }
}
