import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

const API = 'http://127.0.0.1:8081/api';
const STEP_LABELS = ['Informations', 'Vérification', 'Mot de passe'];

// ── Composants définis HORS du parent pour éviter le re-mount à chaque frappe ──

function StepBar({ step }) {
    return (
        <div className="flex items-center justify-between mb-8">
            {STEP_LABELS.map((label, i) => {
                const s = i + 1;
                const isDone = step > s;
                const isActive = step === s;
                return (
                    <div key={s} className="flex-1 flex flex-col items-center relative">
                        {s < 3 && (
                            <div className={`absolute top-4 left-1/2 w-full h-0.5 transition-all ${isDone ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        )}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all border-2 ${
                            isDone
                                ? 'bg-green-500 border-green-500 text-white'
                                : isActive
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}>
                            {isDone ? <span className="material-symbols-outlined text-base">check</span> : s}
                        </div>
                        <span className={`mt-1.5 text-xs font-semibold ${isActive || isDone ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                            {label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function Alert({ type, msg }) {
    return (
        <div className={`mb-5 p-4 rounded-xl flex items-start gap-2 text-sm border ${
            type === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        }`}>
            <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                {type === 'error' ? 'error' : 'info'}
            </span>
            <span>{msg}</span>
        </div>
    );
}

function InputField({ id, label, icon, type = 'text', placeholder, value, onChange }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor={id}>
                {label}
            </label>
            <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
                    {icon}
                </span>
                <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete="off"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
            </div>
        </div>
    );
}

export default function RegisterPage() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nom: '', prenom: '', email: '', numeroCarteIdentite: '',
        password: '', confirmPassword: ''
    });
    const [step, setStep] = useState(1);
    const [verificationCode, setVerificationCode] = useState('');
    const [verifiedCode, setVerifiedCode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    const handleChange = (e) =>
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));

    // ── Étape 1 → 2 : envoi du code OTP ──────────────────────────
    const handleSendCode = async () => {
        setError(''); setInfo('');
        if (!formData.prenom || !formData.nom || !formData.email || !formData.numeroCarteIdentite) {
            setError('Veuillez remplir tous les champs.'); return;
        }
        if (!/\S+@\S+\.\S+/.test(formData.email)) {
            setError('Adresse email invalide.'); return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/send-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, prenom: formData.prenom, nom: formData.nom, numeroCarteIdentite: formData.numeroCarteIdentite })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStep(2);
                setInfo(`Code envoyé à ${formData.email}. Vérifiez aussi vos spams.`);
            } else {
                setError(data.message || "Erreur lors de l'envoi du code.");
            }
        } catch {
            setError('Impossible de contacter le serveur. Vérifiez que le backend est lancé (port 8081).');
        } finally { setLoading(false); }
    };

    // ── Étape 2 → 3 : vérification du code OTP ───────────────────
    const handleVerifyCode = async () => {
        setError(''); setInfo('');
        if (!verificationCode || verificationCode.length < 6) {
            setError('Veuillez saisir le code à 6 chiffres.'); return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, code: verificationCode })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setVerifiedCode(verificationCode);
                setStep(3); setError('');
            } else {
                setError(data.message || 'Code incorrect. Vérifiez le code saisi.');
            }
        } catch { setError('Erreur de connexion. Réessayez.'); }
        finally { setLoading(false); }
    };

    // ── Étape 3 : finalisation ────────────────────────────────────
    const handleRegister = async (e) => {
        e.preventDefault(); setError('');
        if (!formData.password || formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères.'); return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas.'); return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email, nom: formData.nom, prenom: formData.prenom,
                    numeroCarteIdentite: formData.numeroCarteIdentite,
                    password: formData.password, code: verifiedCode
                })
            });
            const data = await res.json();
            if (res.ok && data.success) { setStep(4); }
            else { setError(data.message || 'Erreur lors de la création du compte.'); }
        } catch { setError('Erreur serveur. Réessayez.'); }
        finally { setLoading(false); }
    };


    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="flex min-h-screen flex-col lg:flex-row">

                {/* ── Panneau gauche ── */}
                <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden bg-background-dark">
                    {/* Photo de fond */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-background-dark/90 via-background-dark/60 to-transparent z-10" />
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCS-iJEAXPpeBN3xbRUYV8QlmhKb5-AFRqsv9xxQgQQXl-3pu5M_lXnWNWGghzIIkPThiAJb8goX3kuo0oZrTndv6_2Jb-qCS7yExESe99X8GwxCsSJRrDwWsaqZek-65Mc-D3qdRVy0cpxrm2jp_Hk6IzH6Se0VeDgJR4vO2yYLItGPNNZWI1r2QyXvUPIFcDQs7M5KbVLCITYSyJw0j_fR9pRrJiIXxjTmMmMM_jmybm9SyhKUo_KY_zo0gf4DRRjpSJHHeeZGGk')" }}
                        />
                    </div>
                    {/* Logo */}
                    <div className="relative z-20 flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg">
                            <span className="material-symbols-outlined text-white text-2xl">biotech</span>
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight">SMART INSPECT</span>
                    </div>
                    {/* Texte principal */}
                    <div className="relative z-20 max-w-xl">
                        <h1 className="text-white text-5xl font-black leading-tight tracking-tight mb-6">
                            Votre portail<br />d'inspection industrielle.
                        </h1>
                        <p className="text-slate-200 text-lg font-medium leading-relaxed">
                            Créez votre compte pour accéder aux analyses de produits et piloter votre performance en temps réel.
                        </p>
                    </div>
                    {/* Stats */}
                    <div className="relative z-20 flex flex-wrap gap-4">
                        {[
                            { label: 'Précision', val: '99.8%' },
                            { label: 'Latence', val: '< 15ms' },
                            { label: 'Défauts', val: '402 pts' },
                        ].map(s => (
                            <div key={s.label} className="glass-card flex-1 min-w-[140px] p-5 rounded-xl">
                                <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">{s.label}</p>
                                <p className="text-white text-3xl font-bold">{s.val}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Panneau droit ── */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background-light dark:bg-background-dark">
                    <div className="w-full max-w-md">

                        {/* Logo mobile */}
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                            <div className="bg-primary p-2 rounded-lg">
                                <span className="material-symbols-outlined text-white text-2xl">biotech</span>
                            </div>
                            <span className="text-slate-900 dark:text-white font-bold text-2xl">SMART INSPECT</span>
                        </div>

                        {/* Card principale */}
                        <div className="bg-white dark:bg-slate-900/50 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">

                            {/* ── SUCCÈS (Étape 4) ── */}
                            {step === 4 ? (
                                <div className="flex flex-col items-center text-center py-4">
                                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 border-4 border-green-200 dark:border-green-800">
                                        <span className="material-symbols-outlined text-green-500 text-4xl">how_to_reg</span>
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Inscription réussie !</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                                        Votre compte a été créé avec succès.<br />
                                        Il sera activé par l'administrateur avant que vous puissiez vous connecter.
                                    </p>
                                    <Link
                                        to="/login"
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">login</span>
                                        Aller à la connexion
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    {/* En-tête */}
                                    <div className="mb-6 text-center lg:text-left">
                                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Créer un compte</h2>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                            Veuillez saisir vos informations pour accéder à la plateforme.
                                        </p>
                                    </div>

                                    {/* Indicateur d'étapes */}
                                    <StepBar step={step} />

                                    {/* Alertes */}
                                    {error && <Alert type="error" msg={error} />}
                                    {info && !error && <Alert type="info" msg={info} />}

                                    {/* ── ÉTAPE 1 : Informations ── */}
                                    {step === 1 && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputField id="prenom" label="Prénom" icon="person" placeholder="Jean" value={formData.prenom} onChange={handleChange} />
                                                <InputField id="nom" label="Nom" icon="badge" placeholder="Dupont" value={formData.nom} onChange={handleChange} />
                                            </div>
                                            <InputField id="numeroCarteIdentite" label="Numéro Carte d'Identité" icon="id_card" placeholder="Ex: 12345678" value={formData.numeroCarteIdentite} onChange={handleChange} />
                                            <InputField id="email" label="Adresse Email" icon="mail" type="email" placeholder="exemple@gmail.com" value={formData.email} onChange={handleChange} />
                                            <button
                                                onClick={handleSendCode}
                                                disabled={loading}
                                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                                            >
                                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                                    <><span className="material-symbols-outlined">send</span> Envoyer le code de validation</>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    {/* ── ÉTAPE 2 : Code OTP ── */}
                                    {step === 2 && (
                                        <div className="space-y-4">
                                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex items-start gap-3">
                                                <span className="material-symbols-outlined text-primary text-2xl mt-0.5 shrink-0">mark_email_unread</span>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    Un code à 6 chiffres a été envoyé à<br />
                                                    <span className="font-bold text-primary">{formData.email}</span><br />
                                                    <span className="text-xs text-slate-400">Vérifiez aussi vos spams.</span>
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="otp">
                                                    Code de vérification
                                                </label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">pin</span>
                                                    <input
                                                        id="otp"
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={6}
                                                        placeholder="000000"
                                                        value={verificationCode}
                                                        onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-center text-2xl font-bold tracking-widest"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleVerifyCode}
                                                disabled={loading || verificationCode.length < 6}
                                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                                            >
                                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                                    <><span className="material-symbols-outlined">verified</span> Valider le code</>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { setStep(1); setError(''); setInfo(''); setVerificationCode(''); }}
                                                className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-outlined">arrow_back</span>
                                                Modifier les informations
                                            </button>
                                        </div>
                                    )}

                                    {/* ── ÉTAPE 3 : Mot de passe ── */}
                                    {step === 3 && (
                                        <form onSubmit={handleRegister} className="space-y-4">
                                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                                                <span className="material-symbols-outlined text-green-500 text-2xl shrink-0">verified_user</span>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="font-bold text-green-600 dark:text-green-400">Email vérifié !</span><br />
                                                    Définissez maintenant votre mot de passe.
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="password">
                                                    Mot de passe
                                                </label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">lock</span>
                                                    <input
                                                        id="password"
                                                        type={showPassword ? 'text' : 'password'}
                                                        placeholder="Minimum 6 caractères"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(p => !p)}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="confirmPassword">
                                                    Confirmer le mot de passe
                                                </label>
                                                <div className="relative">
                                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">lock_reset</span>
                                                    <input
                                                        id="confirmPassword"
                                                        type="password"
                                                        placeholder="Répétez le mot de passe"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
                                            >
                                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                                                    <><span className="material-symbols-outlined">how_to_reg</span> Finaliser l'inscription</>
                                                )}
                                            </button>
                                        </form>
                                    )}

                                    {/* Lien connexion */}
                                    <div className="mt-8 text-center">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Déjà un compte ?{' '}
                                            <Link className="text-primary font-bold hover:underline" to="/login">Se connecter</Link>
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Liens footer */}
                        <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
                                <span className="material-symbols-outlined text-sm">shield</span> Sécurité JWT
                            </a>
                            <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
                                <span className="material-symbols-outlined text-sm">api</span> Documentation API
                            </a>
                            <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
                                <span className="material-symbols-outlined text-sm">support_agent</span> Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
