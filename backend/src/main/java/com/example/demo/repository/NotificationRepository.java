package com.example.demo.repository;

import com.example.demo.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // ── Fetch all notifications for a user, newest first ──
    List<Notification> findByUserEmailOrderByCreatedAtDesc(String userEmail);

    // ── Count unread notifications ──
    long countByUserEmailAndIsReadFalse(String userEmail);

    // ── Hard delete ALL notifications for a user (case-insensitive) ──
    @Modifying
    @Transactional
    @Query("DELETE FROM Notification n WHERE LOWER(n.userEmail) = LOWER(:userEmail)")
    void deleteByUserEmail(@Param("userEmail") String userEmail);

    // ── Anti-duplicate: find recent identical notifications ──
    @Query("SELECT n FROM Notification n WHERE n.userEmail = :userEmail AND n.message = :message AND n.createdAt >= :since")
    List<Notification> findRecentByEmailAndMessage(
        @Param("userEmail") String userEmail,
        @Param("message") String message,
        @Param("since") LocalDateTime since
    );
}
