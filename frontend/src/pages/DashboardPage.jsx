import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import './DashboardPage.css';

export default function DashboardPage() {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Utilisateur';

    const stats = [
        { label: "Inspections Réussies", value: "124", icon: "check_circle", theme: "stat-success" },
        { label: "En Cours", value: "3", icon: "more_horiz", theme: "stat-pending" },
        { label: "Précision IA", value: "99.2%", icon: "trending_up", theme: "stat-info" },
        { label: "Temps Moyen", value: "1.2s", icon: "timer", theme: "stat-neutral" }
    ];

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <UserLayout activePage="dashboard">
            <div className="welcome-section" style={{ marginBottom: '2rem' }}>
                <h1 className="welcome-title text-3xl font-black text-slate-900">Bienvenue, {userName} 👋</h1>
                <p className="welcome-subtitle text-slate-500 mt-2">Gérez vos inspections et analysez vos données avec notre IA avancée.</p>
            </div>
            
            {/* Main Actions */}
            <div className="action-cards">
                {/* Same content as before */}
                <div className="card card-upload">
                    <div>
                        <div className="card-icon">
                            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                        </div>
                        <h2 className="card-title">Nouvelle Inspection IA</h2>
                        <p className="card-desc">
                            Démarrez une nouvelle analyse automatisée en téléchargeant vos fichiers média.
                        </p>
                    </div>
                    <button className="btn-card btn-primary" onClick={() => navigate('/inspection')}>
                        Démarrer
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>

                <div className="card card-history">
                    <div>
                        <div className="card-icon">
                            <span className="material-symbols-outlined text-4xl">history</span>
                        </div>
                        <h2 className="card-title">Historique d'inspection</h2>
                        <p className="card-desc">
                            Accédez à la liste complète de vos rapports précédents et analyses passées.
                        </p>
                    </div>
                    <button className="btn-card btn-primary" onClick={() => navigate('/history')}>
                        Voir l'historique
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>

                <div className="card card-stats">
                    <div>
                        <div className="card-icon">
                            <span className="material-symbols-outlined text-4xl">analytics</span>
                        </div>
                        <h2 className="card-title">Statistiques & Rapports</h2>
                        <p className="card-desc">
                            Visualisez l'évolution des performances et les tableaux de bord analytiques.
                        </p>
                    </div>
                    <button className="btn-card btn-primary" onClick={() => navigate('/statistics')}>
                        Voir statistiques
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>

                <div className="card card-profile">
                    <div>
                        <div className="card-icon">
                            <span className="material-symbols-outlined text-4xl">manage_accounts</span>
                        </div>
                        <h2 className="card-title">Gérer le Profil</h2>
                        <p className="card-desc">
                            Mettez à jour vos informations personnelles et vos préférences de compte.
                        </p>
                    </div>
                    <button className="btn-card btn-outline" onClick={() => navigate('/profile')}>
                        Paramètres
                        <span className="material-symbols-outlined text-lg">settings</span>
                    </button>
                </div>

                <div className="card card-missions">
                    <div>
                        <div className="card-icon">
                            <span className="material-symbols-outlined text-4xl">assignment_turned_in</span>
                        </div>
                        <h2 className="card-title">Mes missions</h2>
                        <p className="card-desc">
                            Consultez vos tâches en cours et l'historique de vos missions assignées.
                        </p>
                    </div>
                    <button className="btn-card btn-primary" onClick={() => navigate('/missions')}>
                        Voir missions
                        <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </button>
                </div>
            </div>

            {/* Stats Section */}
            <section className="stats-section">
                <div className="stats-header">
                    <h2 className="stats-title text-2xl font-bold">Statistiques Rapides</h2>
                    <a href="#" className="btn-link">Voir tout</a>
                </div>
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            <div className={`stat-icon ${stat.theme}`}>
                                <span className="material-symbols-outlined">{stat.icon}</span>
                            </div>
                            <div>
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="dashboard-footer">
                <span>© 2024 SMART INSPECT. Tous droits réservés.</span>
                <div className="footer-links">
                    <a href="#">Conditions d'utilisation</a>
                    <a href="#">Politique de confidentialité</a>
                    <a href="#">Support</a>
                </div>
            </footer>
        </UserLayout>
    );
}
