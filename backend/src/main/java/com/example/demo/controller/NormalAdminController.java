package com.example.demo.controller;

import com.example.demo.entity.NormalAdminEntity;
import com.example.demo.repository.AdminRepository;
import com.example.demo.repository.NormalAdminRepository;
import com.example.demo.repository.PersonneRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin-normal")
@CrossOrigin(origins = "*", allowedHeaders = "*",
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH, RequestMethod.OPTIONS})
public class NormalAdminController {

    @Autowired
    private NormalAdminRepository normalAdminRepository;

    @Autowired
    private AdminRepository superAdminRepository;

    @Autowired
    private PersonneRepository personneRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private VerificationService verificationService;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String PYTHON_SERVICE_URL = "http://localhost:8002";

    // =========================================================
    // 1. Create Normal Admin (Super Admin action)
    // =========================================================
    @PostMapping("/create")
    public ResponseEntity<?> createNormalAdmin(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");
        String nom = request.get("nom");
        String prenom = request.get("prenom");

        if (email == null || password == null || nom == null || prenom == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Tous les champs sont requis."));
        }

        String emailLower = email.toLowerCase().trim();

        // Check uniqueness across all tables
        if (normalAdminRepository.findByEmail(emailLower).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Un admin existe deja avec cet email."));
        }
        if (superAdminRepository.findByEmail(emailLower).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Cet email est reserve au Super Admin."));
        }
        if (personneRepository.findByEmail(emailLower).isPresent()) {
            return ResponseEntity.status(409).body(Map.of("success", false, "message", "Un utilisateur existe deja avec cet email."));
        }

        // Create normal admin
        NormalAdminEntity admin = new NormalAdminEntity(emailLower, password, nom, prenom);
        normalAdminRepository.save(admin);

        // Send welcome email with credentials
        try {
            emailService.sendWelcomeAdminEmail(emailLower, prenom + " " + nom, password);
        } catch (Exception e) {
            System.err.println("[WARN] Welcome email failed: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Admin " + prenom + " " + nom + " cree avec succes. Email de bienvenue envoye.",
            "admin", Map.of("id", admin.getId(), "email", emailLower, "nom", nom, "prenom", prenom)
        ));
    }

    // =========================================================
    // 2. List All Normal Admins (Super Admin view)
    // =========================================================
    @GetMapping("/all")
    public ResponseEntity<List<NormalAdminEntity>> getAllNormalAdmins() {
        return ResponseEntity.ok(normalAdminRepository.findAll());
    }

    // =========================================================
    // 3. Delete a Normal Admin
    // =========================================================
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNormalAdmin(@PathVariable Long id) {
        if (!normalAdminRepository.existsById(id)) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Admin non trouve."));
        }
        normalAdminRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Admin supprime avec succes."));
    }

    // =========================================================
    // 3b. Toggle Admin Status (Active/Inactive)
    // =========================================================
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> toggleAdminStatus(@PathVariable Long id) {
        Optional<NormalAdminEntity> opt = normalAdminRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Admin non trouvé."));
        }
        NormalAdminEntity admin = opt.get();
        admin.setEnabled(!admin.isEnabled());
        normalAdminRepository.save(admin);
        return ResponseEntity.ok(Map.of(
            "success", true, 
            "message", "Statut mis à jour : " + (admin.isEnabled() ? "ACTIF" : "DÉSACTIVÉ"),
            "enabled", admin.isEnabled()
        ));
    }

    // =========================================================
    // 4. Send OTP to Normal Admin (First Login Step 1)
    // =========================================================
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null) return ResponseEntity.badRequest().build();

        Optional<NormalAdminEntity> opt = normalAdminRepository.findByEmail(email.toLowerCase().trim());
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Admin non trouve."));
        }

        NormalAdminEntity admin = opt.get();
        String name = admin.getPrenom() + " " + admin.getNom();
        try {
            verificationService.generateAndSendCode(email.toLowerCase().trim(), name);
        } catch (Exception e) {
            System.err.println("[OTP WARN] Email failed, code still in memory: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Code OTP envoye a " + email));
    }

    // =========================================================
    // 5. Verify OTP (First Login Step 2)
    // =========================================================
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code = request.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email et code requis."));
        }

        if (verificationService.verifyCode(email.toLowerCase().trim(), code)) {
            return ResponseEntity.ok(Map.of("success", true, "message", "OTP valide. Passez a l'enregistrement biometrique."));
        } else {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Code incorrect ou expire."));
        }
    }

    // =========================================================
    // 6. Register Face Vector (First Login Step 3)
    // Calls Python service /extract to get the embedding, saves it to DB
    // =========================================================
    @PostMapping("/register-face")
    public ResponseEntity<?> registerFace(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String imageBase64 = request.get("image");

        if (email == null || imageBase64 == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email et image requis."));
        }

        Optional<NormalAdminEntity> opt = normalAdminRepository.findByEmail(email.toLowerCase().trim());
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Admin non trouve."));
        }

        try {
            ResponseEntity<Map> pythonResponse = restTemplate.postForEntity(
                PYTHON_SERVICE_URL + "/extract",
                Map.of("image", imageBase64),
                Map.class
            );

            Map<String, Object> body = pythonResponse.getBody();
            if (body == null || !Boolean.TRUE.equals(body.get("success"))) {
                String msg = body != null ? (String) body.getOrDefault("message", "Aucun visage detecte.") : "Erreur Python.";
                return ResponseEntity.status(400).body(Map.of("success", false, "message", msg));
            }

            // Save face vector — but do NOT set isFirstLogin=false yet
            // isFirstLogin becomes false only after password change (complete-setup)
            String vectorJson = body.get("vector").toString();
            NormalAdminEntity admin = opt.get();
            admin.setFaceVector(vectorJson);
            normalAdminRepository.save(admin);

            return ResponseEntity.ok(Map.of("success", true, "message", "Visage enregistre. Veuillez definir votre nouveau mot de passe."));

        } catch (Exception e) {
            System.err.println("[FACE REGISTER ERROR] " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur lors de l'enregistrement biometrique: " + e.getMessage()));
        }
    }

    // =========================================================
    // NEW: Complete Setup — Change Password + Set isFirstLogin=false
    // Called at the end of the first-login wizard (Step 4)
    // =========================================================
    @PostMapping("/complete-setup")
    public ResponseEntity<?> completeSetup(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");

        if (email == null || newPassword == null || newPassword.trim().length() < 4) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email et nouveau mot de passe (min. 4 caracteres) requis."));
        }

        Optional<NormalAdminEntity> opt = normalAdminRepository.findByEmail(email.toLowerCase().trim());
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Admin non trouve."));
        }

        NormalAdminEntity admin = opt.get();

        if (admin.getFaceVector() == null) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "L'enregistrement biometrique n'est pas complete."));
        }

        // Set new password and mark first login as done
        admin.setPassword(newPassword.trim());
        admin.setFirstLogin(false);
        normalAdminRepository.save(admin);

        // Clean up OTP code from memory
        verificationService.removeCode(email.toLowerCase().trim());

        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Configuration terminee. Bienvenue " + admin.getPrenom() + " !"
        ));
    }

    // =========================================================
    // 7. Verify Face for Recurring Login
    // Calls Python /verify-dynamic with stored vector from DB
    // =========================================================
    @PostMapping("/verify-face")
    public ResponseEntity<?> verifyFace(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String imageBase64 = request.get("image");

        if (email == null || imageBase64 == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email et image requis."));
        }

        Optional<NormalAdminEntity> opt = normalAdminRepository.findByEmail(email.toLowerCase().trim());
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Admin non trouve."));
        }

        NormalAdminEntity admin = opt.get();
        if (admin.getFaceVector() == null) {
            return ResponseEntity.status(400).body(Map.of("success", false, "message", "Aucune reference biometrique enregistree."));
        }

        try {
            // Call Python /verify-dynamic with stored vector
            ResponseEntity<Map> pythonResponse = restTemplate.postForEntity(
                PYTHON_SERVICE_URL + "/verify-dynamic",
                Map.of("image", imageBase64, "referenceVector", admin.getFaceVector()),
                Map.class
            );

            Map<String, Object> body = pythonResponse.getBody();
            if (body != null && Boolean.TRUE.equals(body.get("match"))) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Visage reconnu. Bienvenue " + admin.getPrenom() + ".",
                    "confidence", body.get("confidence"),
                    "admin", Map.of(
                        "email", admin.getEmail(),
                        "nom", admin.getNom(),
                        "prenom", admin.getPrenom(),
                        "role", admin.getRole()
                    )
                ));
            } else {
                String msg = body != null ? (String) body.getOrDefault("message", "Visage non reconnu.") : "Erreur Python.";
                return ResponseEntity.status(401).body(Map.of("success", false, "message", msg));
            }
        } catch (Exception e) {
            System.err.println("[FACE VERIFY ERROR] " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Erreur lors de la verification: " + e.getMessage()));
        }
    }

    // =========================================================
    // 8. GET My Profile (Normal Admin Session)
    // =========================================================
    @GetMapping("/me")
    public ResponseEntity<?> getProfile(@RequestParam String email) {
        Optional<NormalAdminEntity> opt = normalAdminRepository.findByEmail(email.toLowerCase().trim());
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        }
        return ResponseEntity.status(404).body(Map.of("success", false, "message", "Profil non trouvé."));
    }

    // =========================================================
    // 9. UPDATE Profile (Limited fields for Normal Admin)
    // =========================================================
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request) {
        String currentEmail = request.get("currentEmail"); // Needed if email is changing
        String email = request.get("email");
        String password = request.get("password");
        String telephone = request.get("telephone");
        String adresse = request.get("adresse");
        String photo = request.get("photo");

        Optional<NormalAdminEntity> opt = normalAdminRepository.findByEmail(currentEmail.toLowerCase().trim());
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Admin non trouvé."));
        }

        NormalAdminEntity admin = opt.get();
        String newEmail = email.toLowerCase().trim();

        // Check if email modification doesn't conflict with others
        if (!currentEmail.equalsIgnoreCase(newEmail)) {
            if (normalAdminRepository.findByEmail(newEmail).isPresent() || 
                superAdminRepository.findByEmail(newEmail).isPresent() ||
                personneRepository.findByEmail(newEmail).isPresent()) {
                return ResponseEntity.status(409).body("Cet email est déjà utilisé par un autre compte.");
            }
            admin.setEmail(newEmail);
        }

        if (password != null && !password.isBlank()) admin.setPassword(password);
        if (telephone != null) admin.setTelephone(telephone);
        if (adresse != null) admin.setAdresse(adresse);
        if (photo != null) admin.setPhoto(photo);

        // Enforce: Name and Surname are READ-ONLY for Normal Admins via this endpoint
        // (We ignore 'nom' and 'prenom' if they were sent in the request)

        return ResponseEntity.ok(normalAdminRepository.save(admin));
    }
}
