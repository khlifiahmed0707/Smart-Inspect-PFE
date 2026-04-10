import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Veuillez remplir tous les champs.');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8081/api/personnes/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success) {
                const role = data.role;
                const userName = data.user ? `${data.user.prenom} ${data.user.nom}` : email;
                const userEmail = data.user?.email || email;
                const userPhoto = data.user?.photo || '';

                // ── SUPER ADMIN ─────────────────────────────────────────
                if (role === 'SUPER_ADMIN') {
                    localStorage.setItem('tempAdminEmail', email);
                    localStorage.setItem('userRole', 'SUPER_ADMIN');
                    localStorage.setItem('userEmail', userEmail);
                    localStorage.setItem('userName', userName);
                    localStorage.setItem('userPhoto', userPhoto);
                    navigate('/face-auth');
                    return;
                }

                // ── NORMAL ADMIN ────────────────────────────────────────
                if (role === 'ADMIN_NORMAL') {
                    localStorage.setItem('userRole', 'ADMIN_NORMAL');
                    localStorage.setItem('userEmail', userEmail);
                    localStorage.setItem('userName', userName);
                    localStorage.setItem('userPhoto', userPhoto);
                    localStorage.setItem('tempAdminEmail', email);

                    if (data.isFirstLogin) {
                        // First login: OTP → Biometric enrollment
                        navigate('/admin-first-login');
                    } else {
                        // Recurring login: Face recognition
                        navigate('/face-auth-normal');
                    }
                    return;
                }

                // ── REGULAR USER ────────────────────────────────────────
                localStorage.setItem('userRole', 'USER');
                localStorage.setItem('userEmail', userEmail);
                localStorage.setItem('userName', userName);
                localStorage.setItem('userPhoto', userPhoto);
                navigate('/dashboard');

            } else {
                setError(data.message || 'Identifiants incorrects.');
            }
        } catch (err) {
            setError('Erreur de connexion au serveur. Assurez-vous que le backend est lancé.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
            <div className="flex min-h-screen flex-col lg:flex-row">
                {/* Left Side: Visuals & Info */}
                <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden bg-background-dark">
                    {/* Background Image with Overlay */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-gradient-to-br from-background-dark/90 via-background-dark/60 to-transparent z-10"></div>
                        <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCS-iJEAXPpeBN3xbRUYV8QlmhKb5-AFRqsv9xxQgQQXl-3pu5M_lXnWNWGghzIIkPThiAJb8goX3kuo0oZrTndv6_2Jb-qCS7yExESe99X8GwxCsSJRrDwWsaqZek-65Mc-D3qdRVy0cpxrm2jp_Hk6IzH6Se0VeDgJR4vO2yYLItGPNNZWI1r2QyXvUPIFcDQs7M5KbVLCITYSyJw0j_fR9pRrJiIXxjTmMmMM_jmybm9SyhKUo_KY_zo0gf4DRRjpSJHHeeZGGk')" }}></div>
                    </div>
                    {/* Content Top */}
                    <div className="relative z-20 flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg">
                            <span className="material-symbols-outlined text-white text-2xl">biotech</span>
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight">SMART INSPECT</span>
                    </div>
                    {/* Content Middle */}
                    <div className="relative z-20 max-w-xl">
                        <h1 className="text-white text-5xl font-black leading-tight tracking-tight mb-6">
                            L'intelligence artificielle au service de la qualité.
                        </h1>
                        <p className="text-slate-200 text-lg font-medium leading-relaxed">
                            Détection de défauts en temps réel avec une précision chirurgicale pour l'industrie 4.0.
                        </p>
                    </div>
                    {/* Content Bottom: Stats Cards */}
                    <div className="relative z-20 flex flex-wrap gap-4">
                        <div className="glass-card flex-1 min-w-[140px] p-5 rounded-xl">
                            <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">Précision</p>
                            <p className="text-white text-3xl font-bold">99.8%</p>
                        </div>
                        <div className="glass-card flex-1 min-w-[140px] p-5 rounded-xl">
                            <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">Latence</p>
                            <p className="text-white text-3xl font-bold">&lt; 15ms</p>
                        </div>
                        <div className="glass-card flex-1 min-w-[140px] p-5 rounded-xl">
                            <p className="text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1">Défauts</p>
                            <p className="text-white text-3xl font-bold">402 pts</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background-light dark:bg-background-dark">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
                            <div className="bg-primary p-2 rounded-lg">
                                <span className="material-symbols-outlined text-white text-2xl">biotech</span>
                            </div>
                            <span className="text-slate-900 dark:text-white font-bold text-2xl">SMART INSPECT</span>
                        </div>
                        <div className="bg-white dark:bg-slate-900/50 p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
                            <div className="mb-10 text-center lg:text-left">
                                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Bienvenue</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                    Veuillez saisir vos identifiants pour accéder à la plateforme d'inspection.
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                                    <span className="material-symbols-outlined">error</span>
                                    {error}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2" htmlFor="email">Email professionnel</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                        <input
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                            id="email"
                                            placeholder="nom.prenom@entreprise.com"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Mot de passe</label>
                                        <Link className="text-xs font-bold text-primary hover:underline" to="/recovery">Oublié ?</Link>
                                    </div>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                        <input
                                            className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                                            id="password"
                                            placeholder="••••••••"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <button
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <input className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary/20" id="remember" type="checkbox" />
                                    <label className="ml-2 text-sm text-slate-600 dark:text-slate-400 font-medium" htmlFor="remember">Rester connecté</label>
                                </div>
                                <button
                                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : 'Se connecter'}
                                </button>
                            </form>
                            <div className="mt-8 text-center">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Nouveau sur la plateforme ?
                                    <Link className="text-primary font-bold hover:underline ml-1" to="/register">Créer un compte</Link>
                                </p>
                            </div>
                        </div>
                        {/* Footer Links */}
                        <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
                                <span className="material-symbols-outlined text-sm">shield</span>
                                Sécurité JWT
                            </a>
                            <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
                                <span className="material-symbols-outlined text-sm">api</span>
                                Documentation API
                            </a>
                            <a className="hover:text-primary transition-colors flex items-center gap-1" href="#">
                                <span className="material-symbols-outlined text-sm">support_agent</span>
                                Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
