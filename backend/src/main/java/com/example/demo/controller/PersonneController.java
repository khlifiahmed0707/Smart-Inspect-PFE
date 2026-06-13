package com.example.demo.controller;

import com.example.demo.dto.LoginRequest;
import com.example.demo.dto.LoginResponse;
import com.example.demo.entity.AdminEntity;
import com.example.demo.entity.NormalAdminEntity;
import com.example.demo.entity.Personne;
import com.example.demo.entity.PersonneId;
import com.example.demo.repository.AdminRepository;
import com.example.demo.repository.HistoriqueInspecteurRepository;
import com.example.demo.repository.NormalAdminRepository;
import com.example.demo.repository.PersonneRepository;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class PersonneController {

    @Autowired
    private PersonneRepository repository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private NormalAdminRepository normalAdminRepository;

    @Autowired
    private HistoriqueInspecteurRepository historiqueRepository;

    @Autowired
    private com.example.demo.service.VerificationService verificationService;

    @PostConstruct
    @Transactional
    public void initAdmin() {
        if (adminRepository.count() == 0) {
            AdminEntity admin = new AdminEntity();
            admin.setEmail("ahmedkhlifi0702@gmail.com");
            admin.setPassword("123123");
            admin.setNom("Khlifi");
            admin.setPrenom("Ahmed");
            admin.setRole("ADMIN");
            adminRepository.save(admin);
            System.out.println("[INIT] Created default unique admin account for: ahmedkhlifi0702@gmail.com");
        }

        // ORPHAN CLEANUP: Remove history logs for users that no longer exist
        try {
            List<String> allEmails = repository.findAll().stream().map(Personne::getEmail).map(String::toLowerCase).toList();
            List<String> adminEmails = adminRepository.findAll().stream().map(AdminEntity::getEmail).map(String::toLowerCase).toList();
            List<String> normalAdminEmails = normalAdminRepository.findAll().stream().map(NormalAdminEntity::getEmail).map(String::toLowerCase).toList();
            
            historiqueRepository.findAll().forEach(log -> {
                if (log.getInspecteurEmail() != null) {
                    String logEmail = log.getInspecteurEmail().toLowerCase();
                    if (!allEmails.contains(logEmail) && !adminEmails.contains(logEmail) && !normalAdminEmails.contains(logEmail)) {
                        historiqueRepository.delete(log);
                        System.out.println("[CLEANUP] Removed orphaned inspection log for deleted user: " + logEmail);
                    }
                }
            });
        } catch (Exception e) {
            System.err.println("[CLEANUP ERROR] " + e.getMessage());
        }
    }

    private static final Map<String, Integer> faceAuthAttempts = new HashMap<>();
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PYTHON_SERVICE_URL = "http://localhost:8002/verify";

    /**
     * Vérifie dynamiquement si un email appartient à un compte admin.
     * Fonctionne même si l'admin a modifié son email depuis son profil.
     */
    private boolean isAdminEmail(String email) {
        if (email == null) return false;
        String e = email.toLowerCase().trim();
        return adminRepository.findByEmail(e).isPresent()
            || normalAdminRepository.findByEmail(e).isPresent();
    }

    @PostMapping("/personnes")
    public ResponseEntity<?> createPersonne(@RequestBody Personne personne, @RequestHeader(value = "X-Role", required = false) String role) {
        // ── ROLE PROTECTION ──────────────────────────────────────
        if ("SUPER_ADMIN".equals(role)) {
            return ResponseEntity.status(403).body("ACCÈS REFUSÉ : Le Super Admin n'est plus autorisé à gérer les utilisateurs.");
        }
        // ─────────────────────────────────────────────────────────

        String emailLower = personne.getEmail().toLowerCase().trim();

        // ── PROTECTION ADMIN ──────────────────────────────────────
        if (isAdminEmail(emailLower)) {
            return ResponseEntity.status(403).body(
                "ACTION REFUSÉE : L'adresse email '" + emailLower + "' est réservée à l'administration de SMART INSPECT."
            );
        }
        // ─────────────────────────────────────────────────────────

        if (repository.findByEmail(emailLower).isPresent()) {
            return ResponseEntity.status(409).body("Ce compte existe déjà avec cet email.");
        }
        if (personne.getNumeroCarteIdentite() != null && repository.findByIdNumeroCarteIdentite(personne.getNumeroCarteIdentite()).isPresent()) {
            return ResponseEntity.status(409).body("Ce compte existe déjà avec ce CIN.");
        }
        personne.setEmail(emailLower); // Ensure email is saved in lowercase
        return ResponseEntity.ok(repository.save(personne));
    }

    @GetMapping("/personnes-count")
    public long countPersonnes() {
        return repository.count();
    }

    @GetMapping("/personnes")
    public ResponseEntity<?> getAllPersonnes(@RequestHeader(value = "X-Role", required = false) String role) {
        // SUPER_ADMIN is allowed to VIEW (Situation), but not manage (Gestion)
        return ResponseEntity.ok(repository.findAll());
    }

    @PutMapping("/personnes/{email}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable("email") String email, @RequestHeader(value = "X-Role", required = false) String role) {
        // ── ROLE PROTECTION ──────────────────────────────────────
        if ("SUPER_ADMIN".equals(role)) {
            return ResponseEntity.status(403).body("ACCÈS REFUSÉ : Le Super Admin n'est plus autorisé à modifier le statut des utilisateurs.");
        }
        // ─────────────────────────────────────────────────────────
        String emailLower = email.toLowerCase().trim();

        // ── PROTECTION ADMIN ──────────────────────────────────────
        if (isAdminEmail(emailLower)) {
            return ResponseEntity.status(403).body(
                "ACTION REFUSÉE : Ce compte appartient à l'administrateur système. Il est protégé et ne peut pas être modifié depuis cette interface."
            );
        }
        // ─────────────────────────────────────────────────────────

        Optional<Personne> personneOpt = repository.findByEmail(emailLower);
        if (personneOpt.isPresent()) {
            Personne p = personneOpt.get();
            p.setEnabled(!p.isEnabled());
            repository.save(p);
            return ResponseEntity.ok(Map.of("success", true, "enabled", p.isEnabled()));
        }
        return ResponseEntity.status(404).body("Utilisateur non trouvé");
    }

    @GetMapping("/personnes/by-cin/{cin}")
    public ResponseEntity<?> getByCin(@PathVariable("cin") String cin) {
        Optional<Personne> personneOpt = repository.findByIdNumeroCarteIdentite(cin);
        if (personneOpt.isPresent()) {
            return ResponseEntity.ok(personneOpt.get());
        }
        return ResponseEntity.status(404).body("Utilisateur non trouvé avec ce CIN.");
    }

    @GetMapping("/personnes/by-email/{email}")
    public ResponseEntity<?> getByEmail(@PathVariable("email") String email) {
        System.out.println("Recherche profil pour email: " + email);
        Optional<Personne> personneOpt = repository.findByEmail(email.toLowerCase());
        if (personneOpt.isPresent()) {
            System.out.println("Utilisateur trouvé: " + personneOpt.get().getNom());
            return ResponseEntity.ok(personneOpt.get());
        }
        System.out.println("Utilisateur NON trouvé pour: " + email);
        return ResponseEntity.status(404).body("Utilisateur non trouvé.");
    }

    @PutMapping("/personnes/update/{email}")
    public ResponseEntity<?> updatePersonne(@PathVariable("email") String email, @RequestBody Personne updatedData, @RequestHeader(value = "X-Role", required = false) String role) {
        // ── ROLE PROTECTION ──────────────────────────────────────
        if ("SUPER_ADMIN".equals(role)) {
            return ResponseEntity.status(403).body("ACCÈS REFUSÉ : Le Super Admin n'est plus autorisé à mettre à jour les utilisateurs.");
        }
        // ─────────────────────────────────────────────────────────
        String currentEmail = email.toLowerCase().trim();
        String newEmail = updatedData.getEmail().toLowerCase().trim();

        // ── PROTECTION ADMIN ──────────────────────────────────────
        // Block modification if the current OR target email belongs to admin
        if (isAdminEmail(currentEmail) || isAdminEmail(newEmail)) {
            return ResponseEntity.status(403).body(
                "ACTION REFUSÉE : Ce compte appartient à l'administrateur système. Utilisez la page 'Mon Profil Admin' pour modifier vos informations."
            );
        }
        // ─────────────────────────────────────────────────────────

        // Check if the new email is already taken by ANOTHER user
        Optional<Personne> existingWithNewEmail = repository.findByEmail(newEmail);
        if (existingWithNewEmail.isPresent() && !currentEmail.equals(newEmail)) {
            return ResponseEntity.status(409).body("impossible de utiliser ce email donc ce email nest pas valable car il deja existe");
        }

        Optional<Personne> personneOpt = repository.findByEmail(currentEmail);

        if (personneOpt.isPresent()) {
            Personne p = personneOpt.get();

            // If email is changing, handle the composite ID change
            if (!currentEmail.equals(newEmail)) {
                repository.delete(p);
                Personne newPersonne = new Personne(
                    newEmail,
                    updatedData.getNom(),
                    updatedData.getPrenom(),
                    updatedData.getPassword(),
                    p.getNumeroCarteIdentite()
                );
                newPersonne.setEnabled(updatedData.isEnabled());
                newPersonne.setRole(p.getRole());
                newPersonne.setTelephone(updatedData.getTelephone() != null ? updatedData.getTelephone() : p.getTelephone());
                newPersonne.setAdresse(updatedData.getAdresse() != null ? updatedData.getAdresse() : p.getAdresse());
                newPersonne.setPhoto(updatedData.getPhoto() != null ? updatedData.getPhoto() : p.getPhoto());
                return ResponseEntity.ok(repository.save(newPersonne));
            }

            // Normal update
            p.setNom(updatedData.getNom());
            p.setPrenom(updatedData.getPrenom());
            p.setPassword(updatedData.getPassword());
            p.setEnabled(updatedData.isEnabled());
            if (updatedData.getRole() != null) p.setRole(updatedData.getRole());
            if (updatedData.getTelephone() != null) p.setTelephone(updatedData.getTelephone());
            if (updatedData.getAdresse() != null) p.setAdresse(updatedData.getAdresse());
            if (updatedData.getPhoto() != null) p.setPhoto(updatedData.getPhoto());
            return ResponseEntity.ok(repository.save(p));
        }
        return ResponseEntity.status(404).body("Utilisateur non trouvé.");
    }

    @DeleteMapping("/personnes/{email}")
    @Transactional
    public ResponseEntity<?> deletePersonne(@PathVariable("email") String email, @RequestHeader(value = "X-Role", required = false) String role) {
        // ── ROLE PROTECTION ──────────────────────────────────────
        if ("SUPER_ADMIN".equals(role)) {
            return ResponseEntity.status(403).body("ACCÈS REFUSÉ : Le Super Admin n'est plus autorisé à supprimer des utilisateurs.");
        }
        // ─────────────────────────────────────────────────────────
        String emailLower = email.toLowerCase().trim();

        // ── PROTECTION ADMIN ──────────────────────────────────────
        if (isAdminEmail(emailLower)) {
            return ResponseEntity.status(403).body(
                "ACTION REFUSÉE : Impossible de supprimer le compte administrateur système."
            );
        }
        // ─────────────────────────────────────────────────────────

        Optional<Personne> personneOpt = repository.findByEmail(emailLower);
        if (personneOpt.isPresent()) {
            Personne p = personneOpt.get();
            String cin = p.getNumeroCarteIdentite();
            
            // CASCADE DELETE: Remove all inspection history associated with this user
            try {
                historiqueRepository.deleteByInspecteurEmail(emailLower);
                historiqueRepository.deleteByInspecteurNom(p.getNom() + " " + p.getPrenom()); // Fallback if email wasn't saved perfectly
            } catch (Exception e) {
                System.out.println("No history found to delete or error during cascade delete: " + e.getMessage());
            }

            repository.delete(p);
            return ResponseEntity.ok(Map.of("success", true, "message", "Le compte de cette cin " + cin + " est supprimer avec succees !"));
        }
        return ResponseEntity.status(404).body("Utilisateur non trouvé.");
    }

    @PutMapping("/personnes/{email}/remove-photo")
    public ResponseEntity<?> removePhoto(@PathVariable("email") String email) {
        Optional<Personne> personneOpt = repository.findByEmail(email.toLowerCase());
        if (personneOpt.isPresent()) {
            Personne p = personneOpt.get();
            p.setPhoto(null);
            return ResponseEntity.ok(repository.save(p));
        }
        return ResponseEntity.status(404).body("Utilisateur non trouve.");
    }

    @PostMapping("/personnes/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest loginRequest) {
        System.out.println("[DEBUG] Login request received for email: " + loginRequest.getEmail());
        String emailLower = loginRequest.getEmail().toLowerCase();

        // 1. Check Super Admin Table
        Optional<AdminEntity> adminOpt = adminRepository.findByEmail(emailLower);
        if (adminOpt.isPresent()) {
            AdminEntity admin = adminOpt.get();
            if (admin.getPassword().equals(loginRequest.getPassword())) {
                faceAuthAttempts.put("admin", 0);
                Personne p = new Personne();
                p.setEmail(admin.getEmail());
                p.setNom(admin.getNom());
                p.setPrenom(admin.getPrenom());
                p.setPhoto(admin.getPhoto());
                p.setRole("SUPER_ADMIN");
                return ResponseEntity.ok(new LoginResponse(true, "Veuillez confirmer votre identite par reconnaissance faciale", "SUPER_ADMIN", p, true, false));
            }
        }

        // 2. Check Normal Admin Table
        Optional<NormalAdminEntity> normalAdminOpt = normalAdminRepository.findByEmail(emailLower);
        if (normalAdminOpt.isPresent()) {
            NormalAdminEntity normalAdmin = normalAdminOpt.get();
            if (normalAdmin.getPassword().equals(loginRequest.getPassword())) {
                if (!normalAdmin.isEnabled()) {
                    return ResponseEntity.status(403).body(new LoginResponse(false, "Votre accès administrateur a été suspendu. Veuillez contacter le Super Admin.", null, null, false));
                }
                Personne p = new Personne();
                p.setEmail(normalAdmin.getEmail());
                p.setNom(normalAdmin.getNom());
                p.setPrenom(normalAdmin.getPrenom());
                p.setPhoto(normalAdmin.getPhoto());
                p.setRole("ADMIN_NORMAL");
                boolean firstLogin = normalAdmin.isFirstLogin();
                // First login: needs OTP + biometric enrollment (no face yet)
                // Recurring login: needs face verification
                return ResponseEntity.ok(new LoginResponse(
                    true,
                    firstLogin ? "Premiere connexion : verification OTP requise" : "Identification biometrique requise",
                    "ADMIN_NORMAL",
                    p,
                    !firstLogin,   // needsFaceAuth = true only for recurring logins
                    firstLogin     // isFirstLogin flag
                ));
            }
        }

        // 3. Check regular users
        Optional<Personne> personneOpt = repository.findByEmail(emailLower);
        if (personneOpt.isPresent()) {
            Personne p = personneOpt.get();
            if (p.getPassword().equals(loginRequest.getPassword())) {
                if (!p.isEnabled()) {
                    return ResponseEntity.status(403).body(new LoginResponse(false, "Votre compte n'est pas encore active. Veuillez contacter l'administrateur.", null, null, false));
                }
                return ResponseEntity.ok(new LoginResponse(true, "Connexion reussie", "USER", p, false));
            }
        }

        return ResponseEntity.status(401).body(new LoginResponse(false, "Identifiants incorrects", null, null, false));
    }

    // --- Admin Unique Profile Endpoints ---

    @GetMapping("/admin/me")
    public ResponseEntity<?> getAdminProfile() {
        AdminEntity admin = adminRepository.findAll().get(0); // Get the unique admin
        return ResponseEntity.ok(admin);
    }

    @PutMapping("/admin/update")
    public ResponseEntity<?> updateAdmin(@RequestBody AdminEntity updatedData) {
        AdminEntity admin = adminRepository.findAll().get(0);
        String newEmail = updatedData.getEmail().toLowerCase();

        // Check if the new email exists in User Table (Personne)
        if (repository.findByEmail(newEmail).isPresent()) {
            return ResponseEntity.status(409).body("impossible de utiliser ce email donc ce email nest pas valable car il deja existe");
        }

        // Update fields
        admin.setEmail(newEmail);
        admin.setPassword(updatedData.getPassword());
        admin.setNom(updatedData.getNom());
        admin.setPrenom(updatedData.getPrenom());
        if (updatedData.getPhoto() != null) admin.setPhoto(updatedData.getPhoto());

        return ResponseEntity.ok(adminRepository.save(admin));
    }

    @PostMapping("/face/verify")
    public ResponseEntity<?> verifyFace(@RequestBody Map<String, String> request) {
        String imageBase64 = request.get("image");
        int attempts = faceAuthAttempts.getOrDefault("admin", 0);

        if (attempts >= 3) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Compte bloqué temporairement : trop de tentatives échouées."));
        }

        try {
            // Call Python service
            ResponseEntity<Map> response = restTemplate.postForEntity(PYTHON_SERVICE_URL, Map.of("image", imageBase64), Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && Boolean.TRUE.equals(body.get("match"))) {
                faceAuthAttempts.remove("admin");
                return ResponseEntity.ok(Map.of("success", true, "message", "Visage reconnu. Bienvenue Admin.", "confidence", body.get("confidence")));
            } else {
                attempts++;
                faceAuthAttempts.put("admin", attempts);
                return ResponseEntity.status(401).body(Map.of(
                    "success", false, 
                    "message", "Visage non reconnu (Tentative " + attempts + "/3)", 
                    "remaining", 3 - attempts
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur de connexion au service de reconnaissance faciale."));
        }
    }

    // --- Account Recovery Endpoints ---

    @PostMapping("/recovery/verify-email")
    public ResponseEntity<?> verifyRecoveryEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase();
        
        Optional<AdminEntity> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            return ResponseEntity.ok(Map.of("success", true, "role", "ADMIN"));
        }

        Optional<Personne> personneOpt = repository.findByEmail(email);
        if (personneOpt.isPresent()) {
            Personne p = personneOpt.get();
            if (!p.isEnabled()) {
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Votre compte est désactivé. Réinitialisation impossible."));
            }
            return ResponseEntity.ok(Map.of("success", true, "role", "USER"));
        }

        return ResponseEntity.status(404).body(Map.of("success", false, "message", "Email introuvable."));
    }

    @PostMapping("/recovery/verify-cin")
    public ResponseEntity<?> verifyRecoveryCin(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase();
        String cin = request.get("cin");

        Optional<Personne> personneOpt = repository.findByEmail(email);
        if (personneOpt.isPresent() && cin.equals(personneOpt.get().getNumeroCarteIdentite())) {
            return ResponseEntity.ok(Map.of("success", true));
        }

        return ResponseEntity.status(401).body(Map.of("success", false, "message", "CIN incorrect pour cet email."));
    }

    @PostMapping("/recovery/reset-password")
    public ResponseEntity<?> resetPasswordOLD(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase();
        String newPassword = request.get("newPassword");

        Optional<AdminEntity> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            AdminEntity admin = adminOpt.get();
            admin.setPassword(newPassword);
            adminRepository.save(admin);
            return ResponseEntity.ok(Map.of("success", true, "message", "Mot de passe administrateur réinitialisé avec succès."));
        }

        Optional<Personne> personneOpt = repository.findByEmail(email);
        if (personneOpt.isPresent()) {
            Personne p = personneOpt.get();
            if (!p.isEnabled()) {
                return ResponseEntity.status(403).body(Map.of("success", false, "message", "Compte désactivé. Action interdite."));
            }
            p.setPassword(newPassword);
            repository.save(p);
            return ResponseEntity.ok(Map.of("success", true, "message", "Mot de passe utilisateur réinitialisé avec succès."));
        }

        return ResponseEntity.status(404).body(Map.of("success", false, "message", "Utilisateur introuvable."));
    }

    // ============================================================
    // INSCRIPTION EN 3 ÉTAPES
    // Étape 1 : Envoyer le code OTP
    // Étape 2 : Vérifier le code
    // Étape 3 : Finaliser l'inscription (POST /api/personnes)
    // ============================================================

    // ============================================================
    // ÉTAPE 1 : Vérifier les doublons ET envoyer le code OTP
    // ============================================================
    @PostMapping("/auth/send-code")
    public ResponseEntity<?> sendVerificationCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String cin = request.get("numeroCarteIdentite");
        String prenom = request.get("prenom");
        String nom = request.get("nom");

        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email requis."));
        }

        // Blocage dynamique : si l'email appartient à un compte admin (quel que soit l'email actuel)
        if (isAdminEmail(email)) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Cette adresse email est réservée à l'administrateur. Veuillez utiliser une autre adresse."
            ));
        }

        // Vérification des doublons avant envoi du code
        if (repository.findByEmail(email.toLowerCase()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Un compte existe déjà avec cet email."));
        }
        if (cin != null && !cin.isBlank() && repository.findByIdNumeroCarteIdentite(cin).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Un compte existe déjà avec ce numéro de carte d'identité."));
        }

        String name = (prenom != null ? prenom : "") + " " + (nom != null ? nom : "");

        try {
            verificationService.generateAndSendCode(email.trim(), name.trim());
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Un code de vérification a été envoyé à " + email
            ));
        } catch (Exception e) {
            System.err.println("[SMTP ERROR] Échec envoi email à : " + email);
            System.err.println("[SMTP ERROR] Cause : " + e.getMessage());
            // Le code est quand même généré en mémoire, l'utilisateur peut voir dans la console
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Impossible d'envoyer l'email. Vérifiez : 1) Le mot de passe d'application Gmail. 2) Que l'IMAP est activé. 3) Consultez la console du serveur pour le code de secours."
            ));
        }
    }

    // ============================================================
    // ÉTAPE 2 : Vérifier le code OTP saisi par l'utilisateur
    // ============================================================
    @PostMapping("/auth/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email et code requis."));
        }

        if (verificationService.verifyCode(email, code)) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Code valide. Vous pouvez définir votre mot de passe."));
        } else {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Code incorrect ou expiré. Vérifiez le code saisi."));
        }
    }

    // ============================================================
    // ÉTAPE 3 : Finalisation de l'inscription (déjà gérée par POST /api/personnes)
    // Ce endpoint crée le compte SEULEMENT si le code a été validé
    // ============================================================
    @PostMapping("/auth/register")
    public ResponseEntity<?> registerAfterVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");
        String password = request.get("password");
        String nom = request.get("nom");
        String prenom = request.get("prenom");
        String cin = request.get("numeroCarteIdentite");

        if (email == null || code == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Données incomplètes."));
        }

        // Double protection dynamique : blocage de tout email admin actuel
        if (isAdminEmail(email)) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Cette adresse email est réservée à l'administrateur."
            ));
        }

        // Re-vérification du code (sécurité)
        if (!verificationService.verifyCode(email, code)) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Code de vérification invalide."));
        }

        // Vérification double des doublons avant création
        if (repository.findByEmail(email.toLowerCase()).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Un compte existe déjà avec cet email."));
        }

        // Création du compte
        Personne personne = new Personne(email.toLowerCase(), nom, prenom, password, cin);
        repository.save(personne);

        // Suppression du code OTP après inscription réussie
        verificationService.removeCode(email);

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Compte créé avec succès ! Attendez l'activation par l'administrateur."
        ));
    }

    // ============================================================
    // ============================================================
    // RÉCUPÉRATION DE MOT DE PASSE (FORGOT PASSWORD) - SÉQUENTIEL
    // Step 1: Identification
    // Step 2: Verification (Face/OTP for Admin, CIN/OTP for User)
    // Step 3: Final Reset
    // ============================================================

    /**
     * Étape 1 : Vérifier l'identité et renvoyer le rôle.
     */
    @PostMapping("/auth/recovery/check-identity")
    public ResponseEntity<?> checkIdentity(@RequestBody Map<String, String> request) {
        String emailInput = request.get("email");
        if (emailInput == null || emailInput.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email requis."));
        }

        String email = emailInput.toLowerCase().trim();

        // 1. Check Super Admin
        Optional<AdminEntity> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "role", "ADMIN",
                "hasFace", true // Super Admin use PKL file, so always has face
            ));
        }

        // 2. Check Normal Admin
        Optional<NormalAdminEntity> normalAdminOpt = normalAdminRepository.findByEmail(email);
        if (normalAdminOpt.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "role", "ADMIN",
                "hasFace", normalAdminOpt.get().getFaceVector() != null
            ));
        }

        // 3. Check Regular User
        Optional<Personne> userOpt = repository.findByEmail(email);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(Map.of(
                "success", true,
                "role", "USER",
                "hasFace", false
            ));
        }

        return ResponseEntity.status(404).body(Map.of("success", false, "message", "Aucun compte trouvé avec cet email."));
    }

    /**
     * Étape 2 (USER ONLY) : Vérifier le CIN.
     */
    @PostMapping("/auth/recovery/verify-cin")
    public ResponseEntity<?> verifyCinRecovery(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();
        String cin = request.get("cin");

        Optional<Personne> userOpt = repository.findByEmail(email);
        if (userOpt.isPresent() && cin.equals(userOpt.get().getNumeroCarteIdentite())) {
            // Send OTP automatically after CIN success
            verificationService.generateAndSendCode(email, userOpt.get().getPrenom() + " " + userOpt.get().getNom());
            return ResponseEntity.ok(Map.of("success", true, "message", "CIN validé. Code OTP envoyé."));
        }

        return ResponseEntity.status(401).body(Map.of("success", false, "message", "Numéro de CIN incorrect."));
    }

    /**
     * Étape 2 (ADMIN ONLY) : Envoyer l'OTP.
     */
    @PostMapping("/auth/recovery/send-otp-admin")
    public ResponseEntity<?> sendOtpAdminRecovery(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();
        String name = "Administrateur";

        Optional<AdminEntity> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) name = adminOpt.get().getPrenom();
        else {
            Optional<NormalAdminEntity> naOpt = normalAdminRepository.findByEmail(email);
            if (naOpt.isPresent()) name = naOpt.get().getPrenom();
        }

        verificationService.generateAndSendCode(email, name);
        return ResponseEntity.ok(Map.of("success", true, "message", "Code OTP envoyé."));
    }

    /**
     * Étape 2 (ADMIN ONLY) : Vérification Faciale pour Récupération.
     */
    @PostMapping("/auth/recovery/verify-face")
    public ResponseEntity<?> verifyFaceRecovery(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();
        String imageBase64 = request.get("image");

        // 1. Check Super Admin (uses PKL file via /verify)
        Optional<AdminEntity> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(
                    "http://localhost:8002/verify",
                    Map.of("image", imageBase64),
                    Map.class
                );
                return ResponseEntity.ok(response.getBody());
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur reconnaissance faciale super admin."));
            }
        }

        // 2. Check Normal Admin (uses DB vector via /verify-dynamic)
        Optional<NormalAdminEntity> naOpt = normalAdminRepository.findByEmail(email);
        if (naOpt.isPresent()) {
            String referenceVector = naOpt.get().getFaceVector();
            if (referenceVector == null) {
                return ResponseEntity.status(400).body(Map.of("success", false, "message", "Référence biométrique introuvable."));
            }
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(
                    "http://localhost:8002/verify-dynamic",
                    Map.of("image", imageBase64, "referenceVector", referenceVector),
                    Map.class
                );
                return ResponseEntity.ok(response.getBody());
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur reconnaissance faciale admin normal."));
            }
        }

        return ResponseEntity.status(404).body(Map.of("success", false, "message", "Compte administrateur introuvable."));
    }

    /**
     * Étape 3 : Réinitialiser le mot de passe.
     */
    @PostMapping("/auth/recovery/reset-password")
    public ResponseEntity<?> resetPasswordFinal(@RequestBody Map<String, String> request) {
        String email = request.get("email").toLowerCase().trim();
        String code = request.get("code");
        String newPassword = request.get("newPassword");

        if (!verificationService.verifyCode(email, code)) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Code OTP invalide."));
        }

        // 1. Super Admin
        Optional<AdminEntity> adminOpt = adminRepository.findByEmail(email);
        if (adminOpt.isPresent()) {
            AdminEntity a = adminOpt.get();
            a.setPassword(newPassword);
            adminRepository.save(a);
        } else {
            // 2. Normal Admin
            Optional<NormalAdminEntity> naOpt = normalAdminRepository.findByEmail(email);
            if (naOpt.isPresent()) {
                NormalAdminEntity na = naOpt.get();
                na.setPassword(newPassword);
                normalAdminRepository.save(na);
            } else {
                // 3. Regular User
                Optional<Personne> userOpt = repository.findByEmail(email);
                if (userOpt.isPresent()) {
                    Personne u = userOpt.get();
                    u.setPassword(newPassword);
                    repository.save(u);
                }
            }
        }

        verificationService.removeCode(email);
        return ResponseEntity.ok(Map.of("success", true, "message", "Sécurité restaurée. Mot de passe mis à jour."));
    }
}
