package com.example.demo.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // =====================================================================
    // Email 1: OTP Verification Code (Profile update, Registration, etc.)
    // =====================================================================
    public void sendVerificationCode(String to, String name, String code) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String htmlContent = "<html>" +
                "<body style='font-family: \"Inter\", \"Roboto\", Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;'>" +
                "  <table width='100%' border='0' cellspacing='0' cellpadding='0'>" +
                "    <tr>" +
                "      <td align='center' style='padding: 40px 0;'>" +
                "        <table width='500' border='0' cellspacing='0' cellpadding='0' style='background-color: #ffffff; border-radius: 24px; padding: 48px;'>" +
                "          <tr>" +
                "            <td align='center' style='padding-bottom: 32px;'>" +
                "              <div style='background-color: #f97316; width: 48px; height: 48px; border-radius: 12px; display: inline-block; vertical-align: middle; line-height: 48px;'>" +
                "                <span style='color: white; font-weight: 950; font-size: 24px;'>S</span>" +
                "              </div>" +
                "              <span style='color: #0f172a; font-size: 20px; font-weight: 900; vertical-align: middle; margin-left: 12px; text-transform: uppercase; letter-spacing: -0.5px;'>SMART INSPECT</span>" +
                "            </td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td>" +
                "              <h2 style='color: #0f172a; font-size: 24px; font-weight: 800; margin-bottom: 16px;'>Bonjour " + name + ",</h2>" +
                "              <p style='color: #475569; font-size: 16px; line-height: 24px; margin-bottom: 32px;'>" +
                "                Pour sécuriser la modification de votre profil, veuillez utiliser le code de vérification ci-dessous :" +
                "              </p>" +
                "            </td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td align='center' style='background-color: #f1f5f9; border-radius: 16px; padding: 24px;'>" +
                "              <span style='color: #f97316; font-size: 42px; font-weight: 900; letter-spacing: 8px; font-family: monospace;'>" + code + "</span>" +
                "            </td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td align='center' style='padding-top: 24px;'>" +
                "              <p style='color: #94a3b8; font-size: 13px; font-weight: 600;'>Ce code expire dans 10 minutes.</p>" +
                "            </td>" +
                "          </tr>" +
                "          <tr>" +
                "            <td style='padding-top: 48px; border-top: 1px solid #f1f5f9;'>" +
                "              <p align='center' style='color: #94a3b8; font-size: 12px; margin: 0;'>" +
                "                Ceci est un message automatique, merci de ne pas y repondre.<br>" +
                "                L'equipe <strong>SMART INSPECT</strong>" +
                "              </p>" +
                "            </td>" +
                "          </tr>" +
                "        </table>" +
                "      </td>" +
                "    </tr>" +
                "  </table>" +
                "</body>" +
                "</html>";

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Code de verification - SMART INSPECT");
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("[EMAIL HTML] Code " + code + " envoye avec succes a " + to);

        } catch (MessagingException e) {
            System.err.println("[EMAIL ERROR] Echec de l'envoi de l'email HTML : " + e.getMessage());
        }
    }

    // =====================================================================
    // Email 2: Welcome Email for Newly Created Normal Admin
    // =====================================================================
    public void sendWelcomeAdminEmail(String to, String name, String password) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String htmlContent = "<html>" +
                "<body style='font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0;'>" +
                "  <table width='100%' border='0' cellspacing='0' cellpadding='0'>" +
                "    <tr><td align='center' style='padding: 40px 0;'>" +
                "      <table width='560' border='0' cellspacing='0' cellpadding='0' style='background-color: #ffffff; border-radius: 24px; overflow: hidden;'>" +
                "        <tr>" +
                "          <td style='background-color: #0f172a; padding: 40px 48px;'>" +
                "            <div style='margin-bottom: 20px;'>" +
                "              <div style='background-color: #f97316; width: 44px; height: 44px; border-radius: 10px; display: inline-block; vertical-align: middle; text-align: center; line-height: 44px;'>" +
                "                <span style='color: white; font-weight: 900; font-size: 22px;'>S</span>" +
                "              </div>" +
                "              <span style='color: white; font-size: 18px; font-weight: 900; vertical-align: middle; margin-left: 10px; text-transform: uppercase; letter-spacing: 1px;'>SMART INSPECT</span>" +
                "            </div>" +
                "            <h1 style='color: white; font-size: 26px; font-weight: 900; margin: 0;'>Bienvenue dans l'equipe !</h1>" +
                "            <p style='color: #94a3b8; font-size: 14px; margin-top: 8px;'>Votre compte Administrateur a ete cree avec succes.</p>" +
                "          </td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style='padding: 48px;'>" +
                "            <h2 style='color: #0f172a; font-size: 20px; font-weight: 800; margin-bottom: 8px;'>Bonjour " + name + ",</h2>" +
                "            <p style='color: #475569; font-size: 15px; line-height: 26px; margin-bottom: 32px;'>" +
                "              Le Super Administrateur de la plateforme <strong>SMART INSPECT</strong> vient de vous creer un compte Administrateur." +
                "            </p>" +
                "            <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 28px; margin-bottom: 28px;'>" +
                "              <p style='color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 16px 0;'>Vos acces provisoires</p>" +
                "              <p style='color: #94a3b8; font-size: 13px; margin: 0 0 4px 0;'>Adresse Email</p>" +
                "              <p style='color: #0f172a; font-size: 16px; font-weight: 700; margin: 0 0 16px 0;'>" + to + "</p>" +
                "              <p style='color: #94a3b8; font-size: 13px; margin: 0 0 4px 0;'>Mot de passe provisoire</p>" +
                "              <p style='color: #f97316; font-size: 22px; font-weight: 900; font-family: monospace; letter-spacing: 4px; margin: 0;'>" + password + "</p>" +
                "            </div>" +
                "            <div style='background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 16px; padding: 20px; margin-bottom: 32px;'>" +
                "              <p style='color: #9a3412; font-size: 13px; font-weight: 700; margin: 0 0 10px 0;'>Actions requises a la 1ere connexion :</p>" +
                "              <p style='color: #7c2d12; font-size: 14px; margin: 0;'>1. Connectez-vous avec email + mot de passe<br>2. Saisissez le code OTP envoye<br>3. Enregistrez votre visage (Face ID)</p>" +
                "            </div>" +
                "          </td>" +
                "        </tr>" +
                "        <tr>" +
                "          <td style='background-color: #f8fafc; padding: 24px 48px; border-top: 1px solid #f1f5f9;'>" +
                "            <p align='center' style='color: #94a3b8; font-size: 12px; margin: 0;'>" +
                "              Message automatique - SMART INSPECT AI</p>" +
                "          </td>" +
                "        </tr>" +
                "      </table>" +
                "    </td></tr>" +
                "  </table>" +
                "</body></html>";

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Vos acces Administrateur - SMART INSPECT");
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("[WELCOME EMAIL] Acces envoyes a " + to);

        } catch (MessagingException e) {
            System.err.println("[EMAIL ERROR] Echec welcome email : " + e.getMessage());
        }
    }
}
