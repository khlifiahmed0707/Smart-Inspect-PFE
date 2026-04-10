import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import './LoginPage.css';

const API = 'http://127.0.0.1:8081/api';

// ── Composants Partagés (Hérités du Design System Login) ─────────────────────

function StepIndicator({ currentStep }) {
    const steps = [
        { id: 1, label: 'Identité', icon: 'fingerprint' },
        { id: 2, label: 'Vérification', icon: 'verified_user' },
        { id: 3, label: 'Sécurité', icon: 'lock_reset' }
    ];

    return (
        <div className="flex items-center justify-between mb-10 px-2 relative">
            <div className="absolute top-4 left-0 w-full h-[2px] bg-slate-100 dark:bg-slate-800 -z-0">
                <div 
                    className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(236,91,19,0.3)]" 
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                ></div>
            </div>
            {steps.map((s) => {
                const isPast = currentStep > s.id;
                const isActive = currentStep === s.id;
                return (
                    <div key={s.id} className="flex flex-col items-center gap-2 relative z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${
                            isActive ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110' :
                            isPast ? 'bg-green-500 border-green-500 text-white' :
                            'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}>
                            <span className="material-symbols-outlined text-lg leading-none">
                                {isPast ? 'check' : s.icon}
                            </span>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-tighter ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            {s.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function InputField({ label, icon, type = 'text', value, onChange, placeholder, disabled, hint }) {
    return (
        <div className="space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</label>
                {hint && <span className="text-[10px] font-bold text-primary italic uppercase tracking-tighter">{hint}</span>}
            </div>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">{icon}</span>
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 font-medium"
                />
            </div>
        </div>
    );
}

// ── Page Principale ───────────────────────────────────────────────

export default function RecoveryPage() {
    const navigate = useNavigate();
    const webcamRef = useRef(null);

    // Flow State
    const [step, setStep] = useState(1); 
    const [subStep, setSubStep] = useState(1); 
    const [role, setRole] = useState(null);
    const [hasFace, setHasFace] = useState(false);

    // Data State
    const [email, setEmail] = useState('');
    const [cin, setCin] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [passwords, setPasswords] = useState({ new: '', confirm: '' });

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleCheckIdentity = async (e) => {
        e.preventDefault();
        setError('');
        if (!email) return;

        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/recovery/check-identity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok) {
                setRole(data.role);
                setHasFace(data.hasFace);
                setStep(2);
                setSubStep(1);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Erreur serveur.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/recovery/verify-cin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, cin })
            });
            const data = await res.json();
            if (res.ok) {
                setSubStep(2);
                setSuccess("Email de vérification envoyé.");
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Erreur de validation CIN.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyFace = async () => {
        if (!webcamRef.current) return;
        const img = webcamRef.current.getScreenshot();
        if (!img) return setError("Caméra inaccessible.");

        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/recovery/verify-face`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, image: img.split(',')[1] })
            });
            const data = await res.json();
            if (res.ok && data.match) {
                setStep(3);
                setSuccess("Biométrie validée.");
            } else {
                setError(data.message || "Visage non reconnu.");
            }
        } catch (e) { setError("Erreur service IA."); }
        finally { setLoading(false); }
    };

    const handleVerifyOtp = (e) => {
        e.preventDefault();
        if (otpCode.length === 6) {
            if (role === 'ADMIN' && hasFace) {
                setSubStep(2); 
            } else {
                setStep(3);
            }
            setError('');
        }
    };

    const handleFinalReset = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) return setError("Mots de passe différents.");

        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/recovery/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: otpCode, newPassword: passwords.new })
            });
            if (res.ok) {
                setStep(4);
            } else {
                const d = await res.json();
                setError(d.message);
            }
        } catch (e) { setError("Erreur système."); }
        finally { setLoading(false); }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="flex min-h-screen flex-col lg:flex-row">
                
                {/* Panel Gauche Visuel - EXACT STYLE LOGIN */}
                <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden bg-background-dark">
                    <div className="absolute inset-0 z-0 text-white">
                        <div className="absolute inset-0 bg-gradient-to-br from-background-dark/90 via-background-dark/60 to-transparent z-10"></div>
                        <img 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCS-iJEAXPpeBN3xbRUYV8QlmhKb5-AFRqsv9xxQgQQXl-3pu5M_lXnWNWGghzIIkPThiAJb8goX3kuo0oZrTndv6_2Jb-qCS7yExESe99X8GwxCsSJRrDwWsaqZek-65Mc-D3qdRVy0cpxrm2jp_Hk6IzH6Se0VeDgJR4vO2yYLItGPNNZWI1r2QyXvUPIFcDQs7M5KbVLCITYSyJw0j_fR9pRrJiIXxjTmMmMM_jmybm9SyhKUo_KY_zo0gf4DRRjpSJHHeeZGGk" 
                            className="w-full h-full object-cover" 
                            alt="Security terminal" 
                        />
                    </div>
                    
                    <div className="relative z-20 flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg">
                            <span className="material-symbols-outlined text-white text-2xl">biotech</span>
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight uppercase">SMART INSPECT</span>
                    </div>

                    <div className="relative z-20 max-w-xl">
                        <h1 className="text-white text-5xl font-black leading-tight tracking-tight mb-6 uppercase">
                            Restaurer<br />
                            <span className="text-primary italic">l'accès maître.</span>
                        </h1>
                        <p className="text-slate-200 text-lg font-medium leading-relaxed">
                            Le protocole de récupération nécessite une authentification multi-facteurs stricte pour garantir l'intégrité de vos privilèges.
                        </p>
                    </div>

                    <div className="relative z-20 flex flex-wrap gap-4">
                        <div className="glass-card flex-1 min-w-[140px] p-5 rounded-xl">
                            <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-1">MÉTHODE A</p>
                            <p className="text-white text-xl font-bold">Biométrie Visuelle</p>
                        </div>
                        <div className="glass-card flex-1 min-w-[140px] p-5 rounded-xl text-white">
                            <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-1">MÉTHODE B</p>
                            <p className="text-white text-xl font-bold">Code OTP Mail</p>
                        </div>
                    </div>
                </div>

                {/* Panel Droit Formulaire - EXACT STYLE LOGIN */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background-light dark:bg-background-dark">
                    <div className="w-full max-w-md">
                        
                        <div className="bg-white dark:bg-slate-900/50 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 relative">
                            
                            {step < 4 && <StepIndicator currentStep={step} />}

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm animate-shake">
                                    <span className="material-symbols-outlined">warning</span>
                                    <span className="font-bold">{error}</span>
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl flex items-center gap-2 text-green-600 dark:text-green-400 text-sm">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <span className="font-bold">{success}</span>
                                </div>
                            )}

                            {/* STEP 1: Identification */}
                            {step === 1 && (
                                <form onSubmit={handleCheckIdentity} className="space-y-6">
                                    <div className="text-center lg:text-left mb-6">
                                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Identification</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Initiez le protocole de récupération sécurisé.</p>
                                    </div>
                                    <InputField label="Email de service" icon="mail" type="email" placeholder="nom.prenom@smart.com" value={email} onChange={e => setEmail(e.target.value)} />
                                    <button 
                                        type="submit" 
                                        disabled={!email || loading}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? "Recherche..." : "Vérif Identity"}
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </button>
                                </form>
                            )}

                            {/* STEP 2: Verification (Dynamic) */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="text-center lg:text-left mb-6">
                                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Vérification</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                            {role === 'ADMIN' ? 'Validation OTP & Biométrie' : 'Validation CIN & OTP'}
                                        </p>
                                    </div>

                                    {role === 'USER' && (
                                        <>
                                            {subStep === 1 ? (
                                                <form onSubmit={handleVerifyCin} className="space-y-6">
                                                    <InputField label="Identifiant National (CIN)" icon="badge" placeholder="A1234567" value={cin} onChange={e => setCin(e.target.value)} />
                                                    <button disabled={!cin || loading} className="w-full bg-slate-900 dark:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all">
                                                        Continuer
                                                    </button>
                                                </form>
                                            ) : (
                                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                                    <InputField label="Code de sécurité" icon="lock" placeholder="******" value={otpCode} onChange={e => setOtpCode(e.target.value)} hint="Vérifiez vos emails" />
                                                    <button disabled={otpCode.length < 6} className="w-full bg-primary text-white font-bold py-4 rounded-xl transition-all shadow-lg">
                                                        Valider Identité
                                                    </button>
                                                </form>
                                            )}
                                        </>
                                    )}

                                    {role === 'ADMIN' && (
                                        <>
                                            {subStep === 1 ? (
                                                <form onSubmit={handleVerifyOtp} className="space-y-6 text-white ">
                                                    <InputField label="Code OTP Master" icon="security" placeholder="******" value={otpCode} onChange={e => setOtpCode(e.target.value)} hint="Envoyé via mail" />
                                                    <button type="submit" disabled={otpCode.length < 6} className="w-full bg-slate-900 border border-slate-700 text-white font-bold py-4 rounded-xl transition-all">
                                                        Valider le code
                                                    </button>
                                                </form>
                                            ) : (
                                                <div className="space-y-6 text-center">
                                                    <div className="relative w-48 h-48 mx-auto rounded-full border-4 border-primary border-dashed p-1">
                                                        <div className="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                                                            <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
                                                            {loading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div></div>}
                                                        </div>
                                                    </div>
                                                    <button onClick={handleVerifyFace} disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined">face_retouching_natural</span>
                                                        Vérification Visage
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* STEP 3: Reset Password */}
                            {step === 3 && (
                                <form onSubmit={handleFinalReset} className="space-y-6">
                                    <div className="text-center lg:text-left mb-6">
                                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Sécurité</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Définissez vos nouveaux paramètres d'accès.</p>
                                    </div>
                                    <InputField label="Clé d'Accès" icon="lock" type="password" placeholder="••••••••" value={passwords.new} onChange={e => setPasswords(p => ({...p, new: e.target.value}))} />
                                    <InputField label="Confirmation" icon="lock_reset" type="password" placeholder="••••••••" value={passwords.confirm} onChange={e => setPasswords(p => ({...p, confirm: e.target.value}))} />
                                    <button 
                                        type="submit" 
                                        disabled={!passwords.new || loading}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                                    >
                                        {loading ? "Traitement..." : "Finaliser Profil"}
                                    </button>
                                </form>
                            )}

                            {/* STEP 4: Success */}
                            {step === 4 && (
                                <div className="text-center py-6">
                                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-100 dark:border-green-800">
                                        <span className="material-symbols-outlined text-green-500 text-4xl">verified</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Accès Restauré</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed max-w-xs mx-auto">Vos privilèges ont été rétablis. Utilisez vos nouveaux paramètres pour vous connecter.</p>
                                    <Link to="/login" className="block w-full bg-slate-900 dark:bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-all hover:opacity-90 active:scale-95">
                                        Retour login
                                    </Link>
                                </div>
                            )}

                            {/* Footer Links */}
                            {step < 4 && (
                                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                                    <Link to="/login" className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-lg">arrow_back</span>
                                        Annuler
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
