import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import './AdminDashboardPage.css';

export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const adminName = localStorage.getItem('userName') || 'Administrateur';

    const [adminStats, setAdminStats] = useState({
        totalUsers: 0,
        userTrend: "+2%",
        totalInspections: 0,
        inspectionTrend: "+100%",
        missionsEnCours: "—",
        avgConfidence: "95,3%",
        iaStatus: "OPTIMAL"
    });

    useEffect(() => {
        const adminEmail = localStorage.getItem('userEmail') || '';

        // ── Fetch mission stats (real endpoint) ──
        fetch(`/api/missions/stats`)
            .then(res => res.json())
            .then(data => {
                setAdminStats(prev => ({
                    ...prev,
                    missionsEnCours: data.enCours !== undefined ? data.enCours : prev.missionsEnCours
                }));
            })
            .catch(err => console.error("Missions stats error:", err));

        // ── Fetch total users ──
        fetch('/api/personnes-count')
            .then(res => res.text())
            .then(count => {
                setAdminStats(prev => ({ ...prev, totalUsers: parseInt(count) || prev.totalUsers }));
            })
            .catch(() => {});

        // ── Fetch total inspections (global) ──
        fetch('/api/inspections/count')
            .then(res => res.json())
            .then(data => {
                if (data.count !== undefined) {
                    setAdminStats(prev => ({ ...prev, totalInspections: data.count }));
                }
            })
            .catch(() => {});


        // ── Refresh missions every 30 seconds (LIVE) ──
        const interval = setInterval(() => {
            fetch('/api/missions/stats')
                .then(res => res.json())
                .then(data => {
                    setAdminStats(prev => ({
                        ...prev,
                        missionsEnCours: data.enCours !== undefined ? data.enCours : prev.missionsEnCours
                    }));
                })
                .catch(() => {});
        }, 30000);

        return () => clearInterval(interval);
    }, []);


    const stats = [
        { label: "Total Utilisateurs", val: adminStats.totalUsers, trend: adminStats.userTrend, icon: "group", color: "bg-blue-50 text-blue-600" },
        { label: "Total Inspections", val: adminStats.totalInspections.toLocaleString(), trend: adminStats.inspectionTrend, icon: "fact_check", color: "bg-purple-50 text-purple-600" },
        { label: "Missions en cours", val: adminStats.missionsEnCours, trend: "LIVE", icon: "assignment", color: "bg-orange-50 text-orange-600" },
        { label: "Performance IA", val: adminStats.avgConfidence, trend: adminStats.iaStatus, icon: "psychology", color: "bg-emerald-50 text-emerald-600" }
    ];

    const managementCards = [
        {
            title: "Gestion des Utilisateurs",
            desc: "Administration des comptes, rôles et permissions des inspecteurs.",
            icon: "manage_accounts",
            theme: "bg-slate-50",
            iconColor: "text-slate-900",
            primaryBtn: "Voir la Situation",
            secondaryBtn: localStorage.getItem('userRole') !== 'SUPER_ADMIN' ? "Nouveau Compte" : null,
            onClick: () => navigate('/admin/users'),
            onSecondaryClick: () => navigate('/admin/user-action')
        },
        {
            title: "Gestion des Missions",
            desc: "Assignation stratégique et monitoring des flux d'inspection.",
            icon: "assignment_turned_in",
            theme: "bg-slate-50",
            iconColor: "text-slate-900",
            primaryBtn: "Gérer Missions",
            onClick: () => navigate('/admin/missions')
        },
        {
            title: "Audit & Analytics",
            desc: "Insights de performance et piste d'audit complète du système.",
            icon: "analytics",
            theme: "bg-slate-50",
            iconColor: "text-slate-900",
            primaryBtn: "Voir Journal d'Audit",
            onClick: () => navigate('/admin/analytics')
        },
        {
            title: "Mon Profil Admin",
            desc: "Gérer mon profil administrateur.",
            icon: "settings",
            theme: "bg-slate-50",
            iconColor: "text-slate-900",
            primaryBtn: "Voir mon profil",
            onClick: () => navigate('/admin/profile')
        }
    ];

    return (
        <AdminLayout activePage="dashboard">
            <div className="admin-content-premium">
                <div className="page-intro-admin flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Cockpit d'Administration</h2>
                        <p className="text-slate-500 font-medium">Contrôle global et monitoring des flux critiques en temps réel.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Système Opérationnel</span>
                    </div>
                </div>

                {/* Main Dashboard Stats */}
                <div className="stats-grid-premium mt-10">
                    {stats.map((stat, id) => (
                        <div key={id} className="stat-card-premium border border-slate-100/50">
                            <div className="card-top-flex">
                                <div className={`stat-icon-box ${stat.color}`}>
                                    <span className="material-symbols-outlined text-2xl font-black">{stat.icon}</span>
                                </div>
                                <span className={`stat-trend-tag ${stat.trend === 'LIVE' || stat.trend === 'OPTIMAL' ? 'bg-green-50 text-green-600' : ''}`}>
                                    {stat.trend}
                                </span>
                            </div>
                            <div className="card-bottom-info mt-6">
                                <p className="stat-label text-slate-400 font-black text-[10px] uppercase tracking-widest">{stat.label}</p>
                                <p className="stat-val text-3xl font-black text-slate-900 mt-1">{stat.val}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Management Sections */}
                <div className="mgt-section-premium mt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                            <span className="material-symbols-outlined text-orange-500">grid_view</span>
                            Modules de Gestion Stratégiques
                        </h3>
                        <div className="h-px flex-1 bg-slate-100 mx-8"></div>
                    </div>

                    <div className="management-grid-premium">
                        {managementCards.map((card, id) => (
                            <div key={id} className="mgt-card-premium bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                                <div className={`mgt-card-header ${card.theme} p-8 flex justify-between items-start`}>
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
                                        <span className={`material-symbols-outlined text-4xl ${card.iconColor}`}>{card.icon}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-200 group-hover:text-orange-200 transition-colors">verified</span>
                                </div>
                                <div className="p-8">
                                    <h4 className="text-lg font-black text-slate-900 mb-2">{card.title}</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8">{card.desc}</p>
                                    <div className="flex flex-col gap-3">
                                        <button className="btn-mgt-primary-orange w-full" onClick={card.onClick}>
                                            {card.primaryBtn}
                                        </button>
                                        {card.secondaryBtn && (
                                            <button className="btn-mgt-secondary-slate w-full" onClick={card.onSecondaryClick}>
                                                {card.secondaryBtn}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
