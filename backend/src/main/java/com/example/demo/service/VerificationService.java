package com.example.demo.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VerificationService {

    @Autowired
    private EmailService emailService;

    // Stockage en mémoire : email -> code
    private final Map<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final Random random = new Random();

    /**
     * Génère un code OTP à 6 chiffres, le stocke et l'envoie par email.
     * @return le code généré
     */
    public String generateAndSendCode(String email, String name) {
        String code = String.format("%06d", random.nextInt(1000000));
        verificationCodes.put(email.toLowerCase(), code);

        // Toujours afficher le code dans la console (filet de sécurité)
        System.out.println("\n========================================");
        System.out.println("  OTP POUR : " + email);
        System.out.println("  CODE     : " + code);
        System.out.println("========================================\n");

        // Envoi email (peut lever une exception si SMTP échoue)
        emailService.sendVerificationCode(email, name, code);

        return code;
    }

    /**
     * Vérifie si le code saisi correspond au code stocké.
     */
    public boolean verifyCode(String email, String codeSaisi) {
        String storedCode = verificationCodes.get(email.toLowerCase());
        if (storedCode != null && storedCode.equals(codeSaisi.trim())) {
            // On garde le code en mémoire jusqu'à la finalisation de l'inscription
            return true;
        }
        return false;
    }

    /**
     * Supprime le code après finalisation de l'inscription.
     */
    public void removeCode(String email) {
        verificationCodes.remove(email.toLowerCase());
    }
}
