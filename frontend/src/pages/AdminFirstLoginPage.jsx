import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import './FaceAuthPage.css';

// ============================================================
// Admin First Login — 4-Step Workflow:
// Step 1: OTP Email Verification
// Step 2: Biometric Face Enrollment (Capture reference)
// Step 3: Mandatory Password Change (Final security layer)
// Step 4: Final Success & Auto-Redirect
// ============================================================

const AdminFirstLoginPage = () => {
    const navigate = useNavigate();
    const webcamRef = useRef(null);
    const email = localStorage.getItem('tempAdminEmail') || '';
    const adminName = localStorage.getItem('userName') || 'Administrateur';

    const [step, setStep] = useState(1);

    // Step 1: OTP states
    const [otpCode, setOtpCode] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Step 2: Face Enrollment states
    const [faceLoading, setFaceLoading] = useState(false);
    const [faceError, setFaceError] = useState('');
    const [faceRegistered, setFaceRegistered] = useState(false);

    // Step 3: Password Change states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwdLoading, setPwdLoading] = useState(false);
    const [pwdError, setPwdError] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    useEffect(() => {
        if (!email) { navigate('/login'); return; }
        // Auto-send OTP on page load for Step 1
        sendOtp();
    }, []);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // --- API Calls ---

    const sendOtp = async () => {
        setOtpError('');
        try {
            await fetch('http://127.0.0.1:8081/api/admin-normal/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            setResendCooldown(60);
        } catch (e) {
            setOtpError('Erreur connexion au service de notification.');
        }
    };

    const handleVerifyOtp = async () => {
        if (otpCode.length !== 6) { setOtpError('Code à 6 chiffres requis.'); return; }
        setOtpLoading(true);
        setOtpError('');
        try {
            const res = await fetch('http://127.0.0.1:8081/api/admin-normal/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otpCode })
            });
            const data = await res.json();
            if (data.success) {
                setStep(2);
            } else {
                setOtpError(data.message || 'Code incorrect ou expiré.');
            }
        } catch (e) {
            setOtpError('Erreur réseau lors de la vérification.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleRegisterFace = async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) { setFaceError('Impossible d\'accéder à la caméra.'); return; }
        setFaceLoading(true);
        setFaceError('');
        try {
            const res = await fetch('http://127.0.0.1:8081/api/admin-normal/register-face', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, image: imageSrc })
            });
            const data = await res.json();
            if (data.success) {
                setFaceRegistered(true);
                // After 1s, move to Step 3
                setTimeout(() => setStep(3), 1000);
            } else {
                setFaceError(data.message || 'Échec de la capture du visage.');
            }
        } catch (e) {
            setFaceError('Erreur de communication avec le service IA.');
        } finally {
            setFaceLoading(false);
        }
    };

    const handleCompleteSetup = async (e) => {
        e.preventDefault();
        setPwdError('');

        if (newPassword.length < 4) {
            setPwdError('Le mot de passe doit contenir au moins 4 caractères.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPwdError('Les mots de passe ne correspondent pas.');
            return;
        }

        setPwdLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8081/api/admin-normal/complete-setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                setStep(4);
                // Final cleanup and redirect after 3 seconds
                setTimeout(() => {
                    localStorage.setItem('userEmail', email); 
                    // userName is already set in localStorage by LoginPage, 
                    // but we can ensure it's picked up by the ProfilePage fetcher.
                    localStorage.removeItem('tempAdminEmail');
                    navigate('/admin');
                }, 3000);
            } else {
                setPwdError(data.message || 'Erreur lors de la finalisation.');
            }
        } catch (e) {
            setPwdError('Erreur réseau lors de la mise à jour du mot de passe.');
        } finally {
            setPwdLoading(false);
        }
    };

    // --- Render Helpers ---

    return (
        <div className="face-auth-container">
            <div className="face-auth-split">
                {/* Panel Gauche — Information & Étapes */}
                <div className="face-auth-left">
                    <div className="face-auth-logo">
                        <div className="logo-icon">
                            <span className="material-symbols-outlined">shield_person</span>
                        </div>
                        <span className="logo-text">SMART INSPECT</span>
                    </div>

                    <div className="face-auth-content">
                        <h1 className="face-auth-title" style={{ fontSize: '28px' }}>Activation de Session Admin</h1>
                        <p className="face-auth-subtitle">
                            Bonjour <strong>{adminName}</strong>, veuillez compléter ces étapes pour sécuriser votre accès.
                        </p>

                        <div className="security-cards" style={{ marginTop: '40px' }}>
                            {/* Étape 1 */}
                            <div className={`security-card ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
                                <div className={`card-icon ${step > 1 ? 'success' : 'warning'}`}>
                                    <span className="material-symbols-outlined">{step > 1 ? 'check_circle' : 'mail_lock'}</span>
                                </div>
                                <div className="card-info">
                                    <h3>1. Vérification OTP</h3>
                                    <p>Confirmation du canal e-mail</p>
                                </div>
                            </div>

                            {/* Étape 2 */}
                            <div className={`security-card ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
                                <div className={`card-icon ${step > 2 ? 'success' : step === 2 ? 'info' : 'pending'}`}>
                                    <span className="material-symbols-outlined">{step > 2 ? 'check_circle' : 'face_recognition'}</span>
                                </div>
                                <div className="card-info">
                                    <h3>2. Référence Biométrique</h3>
                                    <p>Enregistrement du visage (Face ID)</p>
                                </div>
                            </div>

                            {/* Étape 3 */}
                            <div className={`security-card ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
                                <div className={`card-icon ${step > 3 ? 'success' : step === 3 ? 'info' : 'pending'}`}>
                                    <span className="material-symbols-outlined">{step > 3 ? 'check_circle' : 'password'}</span>
                                </div>
                                <div className="card-info">
                                    <h3>3. Nouveau Mot de Passe</h3>
                                    <p>Modification de l'accès provisoire</p>
                                </div>
                            </div>

                            {/* Étape 4 */}
                            <div className={`security-card ${step === 4 ? 'active' : ''}`}>
                                <div className={`card-icon ${step === 4 ? 'success' : 'pending'}`}>
                                    <span className="material-symbols-outlined">{step === 4 ? 'verified_user' : 'lock_clock'}</span>
                                </div>
                                <div className="card-info">
                                    <h3>4. Activation Complète</h3>
                                    <p>Prêt pour le cockpit admin</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="face-auth-footer">
                        <span>SMART INSPECT • PROTOCOLE DE PREMIÈRE CONNEXION</span>
                    </div>
                </div>

                {/* Panel Droit — Interface Interactive */}
                <div className="face-auth-right">
                    
                    {/* STEP 1: OTP */}
                    {step === 1 && (
                        <>
                            <div className="auth-area-header">
                                <h2 className="auth-area-title">Vérification de l'identité</h2>
                                <p className="auth-area-desc">Saisissez le code reçu sur <b>{email}</b></p>
                            </div>
                            <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                <input
                                    type="text" maxLength="6" value={otpCode}
                                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                    style={{
                                        width: '100%', maxWidth: '320px', height: '80px',
                                        background: '#0f172a', border: '2px solid',
                                        borderColor: otpError ? '#ef4444' : '#334155',
                                        borderRadius: '24px', textAlign: 'center',
                                        fontSize: '40px', fontWeight: '900', letterSpacing: '8px', 
                                        color: '#f97316', outline: 'none', fontFamily: 'monospace'
                                    }}
                                    placeholder="000000"
                                />
                                {otpError && <p style={{ color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>{otpError}</p>}
                                <button className="btn-take-photo" onClick={handleVerifyOtp} disabled={otpLoading || otpCode.length < 6} style={{ width: '100%', maxWidth: '320px' }}>
                                    {otpLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "VALIDER LE CODE"}
                                </button>
                                <button onClick={sendOtp} disabled={resendCooldown > 0} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                                    {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : "Renvoyer le code"}
                                </button>
                            </div>
                        </>
                    )}

                    {/* STEP 2: FACE ENROLLMENT */}
                    {step === 2 && (
                        <>
                            <div className="auth-area-header">
                                <h2 className="auth-area-title">Enregistrement Facial</h2>
                                <p className="auth-area-desc">Positionnez votre visage au centre du cadre pour créer votre identifiant biométrique.</p>
                            </div>
                            <div className="face-scanner-viewport">
                                <div className="live-feed-badge"><span className="pulse-dot"></span>LIVE SCANNER</div>
                                {faceError && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-black">{faceError}</div>}
                                {!faceRegistered ? (
                                    <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="face-scan-webcam" videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }} />
                                ) : (
                                    <div className="success-overlay"><span className="material-symbols-outlined text-green-500 text-6xl">face_check</span></div>
                                )}
                                <div className="scanner-frame"><div className="scan-line"></div><div className="tracking-label">{faceLoading ? "ANALYSE..." : "VUE CAMÉRA ACTIVE"}</div></div>
                            </div>
                            <button className="btn-take-photo" onClick={handleRegisterFace} disabled={faceLoading || faceRegistered}>
                                {faceLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "CAPTURER LE VISAGE"}
                            </button>
                        </>
                    )}

                    {/* STEP 3: PASSWORD CHANGE */}
                    {step === 3 && (
                        <>
                            <div className="auth-area-header">
                                <h2 className="auth-area-title">Sécurisation du Compte</h2>
                                <p className="auth-area-desc">L'accès provisoire a expiré. Définissez maintenant votre mot de passe définitif.</p>
                            </div>
                            <form onSubmit={handleCompleteSetup} style={{ padding: '40px', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
                                <div className="space-y-6">
                                    <div className="relative">
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            placeholder="Nouveau mot de passe"
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '2px solid #334155', background: '#0f172a', color: 'white', fontWeight: '700' }}
                                            required
                                        />
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPasswords ? "text" : "password"}
                                            placeholder="Confirmer le mot de passe"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            style={{ width: '100%', height: '60px', padding: '0 20px', borderRadius: '16px', border: '2px solid #334155', background: '#0f172a', color: 'white', fontWeight: '700' }}
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowPasswords(!showPasswords)}>
                                        <span className="material-symbols-outlined text-slate-400 text-sm">{showPasswords ? 'visibility_off' : 'visibility'}</span>
                                        <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Afficher les mots de passe</span>
                                    </div>
                                    {pwdError && <p className="text-red-500 text-xs font-black">{pwdError}</p>}
                                    <button type="submit" className="btn-take-photo w-full" disabled={pwdLoading}>
                                        {pwdLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "ACTIVER MON COMPTE"}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 4 && (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-green-500/20">
                                <span className="material-symbols-outlined text-green-500 text-5xl font-black">verified</span>
                            </div>
                            <h2 className="text-3xl font-black text-white mb-4">Configuration Terminée !</h2>
                            <p className="text-slate-400 font-medium mb-12">Votre profil est désormais actif et sécurisé. Redirection vers le cockpit en cours...</p>
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-1 border-2 border-white/5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 animate-loading-bar" style={{ width: '100%', transition: 'all 3s linear' }}></div>
                                </div>
                                <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Initialisation Cockpit</span>
                            </div>
                        </div>
                    )}

                    <style>{`
                        @keyframes loading-bar { from { width: 0; } to { width: 100%; } }
                        .animate-loading-bar { animation: loading-bar 3s linear; }
                        .pending { opacity: 0.3; filter: grayscale(1); }
                        .completed .card-icon { background: #10b981 !important; color: white !important; }
                        .face-check { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
                    `}</style>
                </div>
            </div>
        </div>
    );
};

export default AdminFirstLoginPage;
