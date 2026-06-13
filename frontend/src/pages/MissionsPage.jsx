import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import './DashboardPage.css';
import './MissionsPage.css';

const prioriteStyle = {
    'Haute': { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-500', label: '🔴 Haute' },
    'Normale': { bg: 'bg-yellow-50', text: 'text-yellow-600', dot: 'bg-yellow-500', label: '🟡 Normale' },
    'Basse': { bg: 'bg-blue-50', text: 'text-blue-500', dot: 'bg-blue-500', label: '🔵 Basse' },
};

const MissionsPage = () => {
    const navigate = useNavigate();
    const userEmail = localStorage.getItem('userEmail') || '';
    const userName = localStorage.getItem('userName') || 'Inspecteur';

    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [markingId, setMarkingId] = useState(null);

    // ── Fetch missions for this inspector ──
    const fetchMissions = useCallback(() => {
        if (!userEmail) return;
        setLoading(true);
        fetch(`/api/missions/my-missions?email=${encodeURIComponent(userEmail)}`)
            .then(r => r.ok ? r.json() : [])
            .then(data => setMissions(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [userEmail]);

    useEffect(() => { fetchMissions(); }, [fetchMissions]);

    // ── Categorise ──
    const activeMissions = missions.filter(m => m.statut === 'En cours' || m.statut === 'En retard');
    const doneMissions = missions.filter(m => m.statut === 'Terminée');

    // ── Search filter ──
    const filterMissions = (list) => {
        if (!searchQuery) return list;
        const q = searchQuery.toLowerCase();
        return list.filter(m =>
            (m.missionRef || '').toLowerCase().includes(q) ||
            (m.pieceAttendue || '').toLowerCase().includes(q) ||
            (m.titre || '').toLowerCase().includes(q) ||
            (m.description || '').toLowerCase().includes(q) ||
            (m.priorite || '').toLowerCase().includes(q)
        );
    };

    // ── Mark as complete (without inspection - fallback) ──
    const handleMarkComplete = async (id) => {
        setMarkingId(id);
        try {
            const res = await fetch(`/api/missions/${id}/complete`, { method: 'PATCH' });
            if (res.ok) fetchMissions();
        } finally {
            setMarkingId(null);
        }
    };

    // ── Launch Inspection with mission context ──
    const handleLaunchInspection = (mission) => {
        // Store mission context so InspectionPage can enforce conformity
        localStorage.setItem('activeMissionId', String(mission.id));
        localStorage.setItem('activeMissionPiece', mission.pieceAttendue || mission.titre || '');
        localStorage.setItem('activeMissionRef', mission.missionRef || `MSN-${mission.id}`);
        navigate('/inspection');
    };

    // ── Time remaining calculation (uses full ISO datetime for minute-precision) ──
    const getTimeRemaining = (m) => {
        // Prefer ISO datetime if available, fallback to date only
        const raw = m.echeanceIso || m.dateEcheance;
        if (!raw) return null;
        let echeance;
        if (m.echeanceIso) {
            echeance = new Date(m.echeanceIso);
        } else {
            // parse dd/MM/yyyy
            const parts = raw.split('/');
            if (parts.length !== 3) return null;
            echeance = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        const now = new Date();
        const diffMs = echeance - now;
        if (diffMs <= 0) return { label: 'En retard', pct: 100, color: 'text-red-500', barColor: 'bg-red-500', isLate: true };
        const diffMin = Math.floor(diffMs / 60000);
        const diffH = Math.floor(diffMin / 60);
        const diffD = Math.floor(diffH / 24);
        let label;
        if (diffD > 0) label = `${diffD}j ${diffH % 24}h`;
        else if (diffH > 0) label = `${diffH}h ${diffMin % 60}min`;
        else label = `${diffMin}min`;
        const pct = Math.max(5, Math.min(100, 100 - (diffD / 7 * 100)));
        return { label, pct, color: diffH < 24 ? 'text-orange-500' : 'text-green-600', barColor: diffH < 24 ? 'bg-orange-500' : 'bg-green-500', isLate: false };
    };

    if (loading) {
        return (
            <UserLayout activePage="missions">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center opacity-30">
                        <div className="w-10 h-10 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm font-black uppercase tracking-widest">Chargement des missions...</p>
                    </div>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout activePage="missions">
            {/* ── Header ── */}
            <header className="page-header" style={{ alignItems: 'flex-start' }}>
                <div className="header-text">
                    <h1 className="welcome-title text-3xl font-black text-slate-900">Tableau de Service</h1>
                    <p className="welcome-subtitle text-slate-500 mt-2">Suivi opérationnel des missions d'inspection.</p>
                </div>
                <div className="header-stats">
                    <div className="stat-card-missions">
                        <p className="stat-label-missions">En cours</p>
                        <p className="stat-value-missions">{missions.filter(m => m.statut === 'En cours').length}</p>
                    </div>
                    <div className="stat-card-missions" style={{ borderLeft: '3px solid #ef4444' }}>
                        <p className="stat-label-missions" style={{ color: '#dc2626' }}>  En retard</p>
                        <p className="stat-value-missions" style={{ color: '#dc2626' }}>{missions.filter(m => m.statut === 'En retard').length}</p>
                    </div>
                    <div className="stat-card-missions">
                        <p className="stat-label-missions tertiary">Terminées</p>
                        <p className="stat-value-missions">{doneMissions.length}</p>
                    </div>
                </div>
            </header>

            {/* ── Filters ── */}
            <div className="filters-container-missions">
                <div className="search-wrapper-missions">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        type="text"
                        placeholder="Rechercher par pièce, priorité ou ID..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <button className="filter-date-btn" onClick={fetchMissions}>
                    <span className="material-symbols-outlined">refresh</span>
                    <span>Actualiser</span>
                </button>
            </div>

            {/* ── Active Missions ── */}
            <section className="missions-section">
                <div className="section-header-missions">
                    <h2>Missions actives <span className="text-orange-500 font-black">({filterMissions(activeMissions).length})</span></h2>
                    <div className="section-divider"></div>
                </div>

                {filterMissions(activeMissions).length === 0 ? (
                    <div className="table-card-missions">
                        <div className="text-center py-16 opacity-30">
                            <span className="material-symbols-outlined text-5xl">task_alt</span>
                            <p className="font-black mt-4 text-sm uppercase tracking-widest">
                                {activeMissions.length === 0 ? 'Aucune mission active assignée' : 'Aucun résultat pour cette recherche'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="table-card-missions">
                        {/* Desktop Table */}
                        <div className="table-responsive hidden md:block">
                            <table className="missions-data-table">
                                <thead>
                                    <tr>
                                        <th>Réf. Mission</th>
                                        <th>Pièce attendue</th>
                                        <th>Échéance</th>
                                        <th>Priorité</th>
                                        <th>Temps restant</th>
                                        <th>Statut</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filterMissions(activeMissions).map(m => {
                                        const time = getTimeRemaining(m);
                                        const pStyle = prioriteStyle[m.priorite] || prioriteStyle['Normale'];
                                        return (
                                            <tr key={m.id}>
                                                <td>
                                                    <span className="font-black text-[11px] text-slate-500 uppercase tracking-widest">
                                                        {m.missionRef || `MSN-${m.id}`}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="piece-cell-missions">
                                                        <div className="piece-img-box" style={{ background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '1.2rem' }}>precision_manufacturing</span>
                                                        </div>
                                                        <div>
                                                            <div className="piece-name-missions">{m.pieceAttendue || m.titre}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div>
                                                        <span className="font-semibold text-slate-700 text-sm">{m.dateEcheance || '—'}</span>
                                                        {m.heureEcheance && <span className="ml-1 text-[10px] font-black text-orange-500">⏰ {m.heureEcheance}</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${pStyle.bg} ${pStyle.text}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot}`}></span>
                                                        {m.priorite}
                                                    </span>
                                                </td>
                                                <td>
                                                    {time ? (
                                                        <div className="progress-cell-missions">
                                                            <span className={`progress-time-text ${time.color}`}>{time.label}</span>
                                                            <div className="progress-bar-missions">
                                                                <div className={`progress-fill-missions ${time.barColor}`} style={{ width: `${time.pct}%` }}></div>
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-slate-400 text-xs">—</span>}
                                                </td>
                                                <td>
                                                    {m.statut === 'En retard' ? (
                                                        <span className="status-tag-missions" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}> En retard</span>
                                                    ) : (
                                                        <span className="status-tag-missions secondary">En cours</span>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <button
                                                        className="analyze-btn"
                                                        onClick={() => handleLaunchInspection(m)}
                                                    >
                                                        Analyser maintenant
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="missions-cards-mobile md:hidden">
                            {filterMissions(activeMissions).map(m => {
                                const time = getTimeRemaining(m.dateEcheance);
                                const pStyle = prioriteStyle[m.priorite] || prioriteStyle['Normale'];
                                return (
                                    <div key={m.id} className="mission-mobile-card">
                                        <div className="mission-card-header">
                                            <div className="mission-admin-info">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${pStyle.bg} ${pStyle.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${pStyle.dot}`}></span>
                                                    {m.priorite}
                                                </span>
                                                <span className="text-[10px] font-black text-slate-400 ml-2">{m.missionRef || `MSN-${m.id}`}</span>
                                            </div>
                                            <span className="status-tag-missions secondary">En cours</span>
                                        </div>
                                        <div className="mission-card-body">
                                            <div className="piece-name-missions text-base">{m.pieceAttendue || m.titre}</div>
                                            {m.description && <p className="mission-desc-mobile mt-2">{m.description}</p>}
                                            <div className="mission-metrics-mobile mt-3">
                                                <div className="mission-metric">
                                                    <span className="m-label">Échéance</span>
                                                    <span className="m-value">{m.dateEcheance || '—'}</span>
                                                </div>
                                                {time && (
                                                    <div className="mission-metric">
                                                        <span className="m-label">Temps restant</span>
                                                        <span className={`m-value ${time.color}`}>{time.label}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mission-card-footer">
                                            <button className="analyze-btn full-width" onClick={() => handleLaunchInspection(m)}>
                                                Analyser maintenant
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* ── Completed Missions ── */}
            <section className="missions-section">
                <div className="section-header-missions">
                    <h2>Missions achevées <span className="text-green-600 font-black">({filterMissions(doneMissions).length})</span></h2>
                    <div className="section-divider"></div>
                </div>

                {filterMissions(doneMissions).length === 0 ? (
                    <div className="table-card-missions">
                        <div className="text-center py-12 opacity-20">
                            <span className="material-symbols-outlined text-4xl">history</span>
                            <p className="font-black mt-2 text-xs uppercase tracking-widest">Aucune mission terminée</p>
                        </div>
                    </div>
                ) : (
                    <div className="table-card-missions">
                        <div className="table-responsive hidden md:block">
                            <table className="missions-data-table">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Réf. Mission</th>
                                        <th>Pièce</th>
                                        <th>Description</th>
                                        <th>Date assignation</th>
                                        <th>Priorité</th>
                                        <th>Statut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y-missions">
                                    {filterMissions(doneMissions).map(m => {
                                        const pStyle = prioriteStyle[m.priorite] || prioriteStyle['Normale'];
                                        return (
                                            <tr key={m.id}>
                                                <td>
                                                    <span className="font-black text-[11px] text-slate-500 uppercase tracking-widest">
                                                        {m.missionRef || `MSN-${m.id}`}
                                                    </span>
                                                </td>
                                                <td className="font-bold text-slate-800 text-sm">{m.pieceAttendue || m.titre}</td>
                                                <td className="text-muted-missions">{m.description || '—'}</td>
                                                <td className="text-slate-500 text-sm">{m.createdAt}</td>
                                                <td>
                                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${pStyle.bg} ${pStyle.text}`}>
                                                        {m.priorite}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="status-tag-missions tertiary">Terminée ✓</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="missions-cards-mobile md:hidden">
                            {filterMissions(doneMissions).map(m => (
                                <div key={m.id} className="mission-mobile-card completed">
                                    <div className="mission-card-header">
                                        <span className="admin-name-mobile">{m.pieceAttendue || m.titre}</span>
                                        <span className="status-tag-missions tertiary">Terminée ✓</span>
                                    </div>
                                    <div className="mission-card-body">
                                        <div className="mission-metrics-mobile">
                                            <div className="mission-metric">
                                                <span className="m-label">Réf</span>
                                                <span className="m-value">{m.missionRef || `MSN-${m.id}`}</span>
                                            </div>
                                            <div className="mission-metric">
                                                <span className="m-label">Date</span>
                                                <span className="m-value tertiary">{m.createdAt}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="table-footer-missions">
                            <span>Affichage de {filterMissions(doneMissions).length} mission(s) terminée(s)</span>
                        </div>
                    </div>
                )}
            </section>

            <footer className="dashboard-footer">
                <span>© 2026 SMART INSPECT. Tous droits réservés.</span>
                <div className="footer-links">
                    <a href="#">Conditions d'utilisation</a>
                    <a href="#">Politique de confidentialité</a>
                    <a href="#">Support</a>
                </div>
            </footer>
        </UserLayout>
    );
};

export default MissionsPage;
