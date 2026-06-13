import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import './MissionManagementPage.css';

const PIECE_OPTIONS = [
    "Carte de Control Wifi",
    "Carte de Puissance",
    "Turbine Fan A-1",
    "Exhaust Nozzle",
    "Control PCB",
    "VAL-HYD",
    "TRB-45",
    "FAN-A1",
];

const PRIORITE_OPTIONS = ["Basse", "Normale", "Haute"];

const statusClass = (statut) => {
    if (statut === 'Terminée') return 'terminee';
    if (statut === 'En cours') return 'en-cours';
    if (statut === 'En retard') return 'en-retard';
    if (statut === 'Annulée') return 'annulee';
    return 'en-retard';
};

const prioriteBadge = (p) => {
    if (p === 'Haute') return { icon: '🔴', cls: 'text-red-600 bg-red-50' };
    if (p === 'Normale') return { icon: '🟡', cls: 'text-yellow-600 bg-yellow-50' };
    return { icon: '🔵', cls: 'text-blue-600 bg-blue-50' };
};

const MissionManagementPage = () => {
    const navigate = useNavigate();
    const adminEmail = localStorage.getItem('userEmail') || '';

    // ── Form States ──
    const [selectedInspecteurEmail, setSelectedInspecteurEmail] = useState('');
    const [inspectorValid, setInspectorValid] = useState(false);
    const [inspectorPhoto, setInspectorPhoto] = useState(null);
    const [inspectorNom, setInspectorNom] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [pieceAttendue, setPieceAttendue] = useState(PIECE_OPTIONS[0]);
    const [priorite, setPriorite] = useState('Normale');
    const [dateEcheance, setDateEcheance] = useState(new Date().toISOString().split('T')[0]);
    const [heureEcheance, setHeureEcheance] = useState('18:00');
    const [dateError, setDateError] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [sendError, setSendError] = useState('');

    // ── Table States ──
    const [missions, setMissions] = useState([]);
    const [loadingMissions, setLoadingMissions] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('toutes');

    // ── Delete Modal States ──
    const [missionToDelete, setMissionToDelete] = useState(null); // { id, ref }
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteToast, setDeleteToast] = useState('');

    // ── Pagination State ──
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // ── Stats ──
    const [stats, setStats] = useState({ enCours: 0, terminees: 0, enRetard: 0 });

    // ── Verify inspector email in real-time ──
    useEffect(() => {
        if (!selectedInspecteurEmail || !selectedInspecteurEmail.includes('@')) {
            setInspectorValid(false);
            setInspectorPhoto(null);
            setInspectorNom('');
            return;
        }

        const timeoutId = setTimeout(() => {
            setIsVerifying(true);
            fetch(`/api/missions/verify-inspecteur?email=${encodeURIComponent(selectedInspecteurEmail.trim())}`)
                .then(r => r.json())
                .then(data => {
                    if (data.valid) {
                        setInspectorValid(true);
                        setInspectorPhoto(data.photo);
                        setInspectorNom(data.nom || '');
                    } else {
                        setInspectorValid(false);
                        setInspectorPhoto(null);
                        setInspectorNom('');
                    }
                })
                .catch(() => {
                    setInspectorValid(false);
                    setInspectorPhoto(null);
                    setInspectorNom('');
                })
                .finally(() => setIsVerifying(false));
        }, 600);

        return () => clearTimeout(timeoutId);
    }, [selectedInspecteurEmail]);

    // ── Date/Time validation ──
    const validateDateTime = (date, heure) => {
        if (!date || !heure) return '';
        const chosen = new Date(`${date}T${heure}`);
        const now = new Date();
        if (chosen <= now) return 'La date ou l\'heure ne peut pas être dans le passé.';
        return '';
    };

    const handleDateChange = (val) => {
        setDateEcheance(val);
        setDateError(validateDateTime(val, heureEcheance));
    };

    const handleHeureChange = (val) => {
        setHeureEcheance(val);
        setDateError(validateDateTime(dateEcheance, val));
    };

    // ── Load missions ──
    const fetchMissions = () => {
        setLoadingMissions(true);
        const url = `/api/missions/all?adminEmail=${encodeURIComponent(adminEmail)}`;
        fetch(url)
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                setMissions(data);
                setStats({
                    enCours: data.filter(m => m.statut === 'En cours').length,
                    terminees: data.filter(m => m.statut === 'Terminée').length,
                    enRetard: data.filter(m => m.statut === 'En retard').length,
                });
            })
            .catch(() => { })
            .finally(() => setLoadingMissions(false));
    };

    useEffect(() => { fetchMissions(); }, []);

    // Reset page when filtering or searching
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter]);

    // ── Send mission ──
    const handleSendMission = async () => {
        if (!selectedInspecteurEmail) return;
        const dtError = validateDateTime(dateEcheance, heureEcheance);
        if (dtError) { setDateError(dtError); return; }
        setIsSending(true);
        setSendError('');
        try {
            const isoDatetime = `${dateEcheance}T${heureEcheance}`;
            const res = await fetch('/api/missions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pieceAttendue,
                    priorite,
                    dateEcheance: isoDatetime,
                    inspecteurEmail: selectedInspecteurEmail.trim(),
                    adminEmail,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setSendSuccess(true);
                fetchMissions();
                setTimeout(() => setSendSuccess(false), 3500);
            } else {
                setSendError(data.message || 'Erreur lors de l\'assignation.');
            }
        } catch {
            setSendError('Erreur réseau.');
        } finally {
            setIsSending(false);
        }
    };

    // ── Delete mission (opens modal) ──
    const handleDelete = (id, ref) => {
        setMissionToDelete({ id, ref: ref || `MSN-${id}` });
    };

    const confirmDelete = async () => {
        if (!missionToDelete) return;
        setIsDeleting(true);
        try {
            await fetch(`/api/missions/${missionToDelete.id}`, { method: 'DELETE' });
            const ref = missionToDelete.ref;
            setMissionToDelete(null);
            fetchMissions();
            setDeleteToast(`Mission ${ref} supprimée avec succès du système.`);
            setTimeout(() => setDeleteToast(''), 4000);
        } finally {
            setIsDeleting(false);
        }
    };

    // ── Filtering ──
    const filteredMissions = missions.filter(m => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q ||
            (m.missionRef || '').toLowerCase().includes(q) ||
            (m.inspecteurNom || '').toLowerCase().includes(q) ||
            (m.inspecteurEmail || '').toLowerCase().includes(q) ||
            (m.titre || '').toLowerCase().includes(q) ||
            (m.pieceAttendue || '').toLowerCase().includes(q);

        if (!matchSearch) return false;
        if (activeFilter === 'chevées') return m.statut === 'Terminée';
        if (activeFilter === 'cours') return m.statut === 'En cours';
        if (activeFilter === 'retard') return m.statut === 'En retard';
        if (activeFilter === 'pas_achevées') return m.statut !== 'Terminée';
        return true;
    });

    // ── Pagination Logic ──
    const totalPages = Math.ceil(filteredMissions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedMissions = filteredMissions.slice(startIndex, startIndex + itemsPerPage);
    const displayStart = filteredMissions.length > 0 ? startIndex + 1 : 0;
    const displayEnd = Math.min(startIndex + itemsPerPage, filteredMissions.length);

    return (
        <>
            <AdminLayout activePage="missions">
                <div className="admin-content-premium">
                    <div className="page-intro-admin">
                        <h2 className="text-2xl font-black text-slate-900">Gestion des Missions</h2>
                        <p className="text-slate-500 font-medium">Surveillez, affectez et optimisez les inspections d'atelier en temps réel.</p>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid-premium mb-8">
                        <div className="stat-card-premium">
                            <div className="card-top-flex">
                                <div className="stat-icon-box bg-orange-50 text-orange-600">
                                    <span className="material-symbols-outlined">pending_actions</span>
                                </div>
                                <span className="stat-trend-tag">Live</span>
                            </div>
                            <div className="card-bottom-info">
                                <p className="stat-label">Missions Actives</p>
                                <p className="stat-val text-orange-600">{String(stats.enCours).padStart(2, '0')}</p>
                            </div>
                        </div>
                        <div className="stat-card-premium">
                            <div className="card-top-flex">
                                <div className="stat-icon-box bg-red-50 text-red-600">
                                    <span className="material-symbols-outlined">running_with_errors</span>
                                </div>
                                <span className="stat-trend-tag bg-red-100 text-red-600">  Alerte</span>
                            </div>
                            <div className="card-bottom-info">
                                <p className="stat-label">En Retard</p>
                                <p className="stat-val text-red-600">{String(stats.enRetard).padStart(2, '0')}</p>
                            </div>
                        </div>
                        <div className="stat-card-premium">
                            <div className="card-top-flex">
                                <div className="stat-icon-box bg-green-50 text-green-600">
                                    <span className="material-symbols-outlined">task_alt</span>
                                </div>
                                <span className="stat-trend-tag">✓</span>
                            </div>
                            <div className="card-bottom-info">
                                <p className="stat-label">Terminées</p>
                                <p className="stat-val text-green-600">{String(stats.terminees).padStart(2, '0')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Assignment Form */}
                    <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-10">
                        <p><strong> Envoyer une mission !</strong></p>
                        {sendSuccess && (
                            <div className="mb-3 px-4 py-2 bg-green-50 border border-green-100 text-green-700 rounded-xl text-xs font-black flex items-center gap-2 animate-slideUp">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Mission assignée avec succès !
                            </div>
                        )}
                        {sendError && (
                            <div className="mb-3 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-black flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {sendError}
                            </div>
                        )}
                        <div className="flex flex-col md:flex-row items-center gap-3">
                            {/* Pièce cible */}
                            <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Pièce Cible</p>
                                <select
                                    className="w-full bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer"
                                    value={pieceAttendue}
                                    onChange={e => setPieceAttendue(e.target.value)}
                                >
                                    {PIECE_OPTIONS.map(p => <option key={p}>{p}</option>)}
                                </select>
                            </div>

                            {/* Opérateur Assigné */}
                            <div className="flex-[1.5] w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Opérateur Assigné</p>
                                <div className="flex items-center gap-2">
                                    {inspectorValid ? (
                                        inspectorPhoto ? (
                                            <img src={inspectorPhoto.startsWith('data:') ? inspectorPhoto : `data:image/jpeg;base64,${inspectorPhoto}`}
                                                alt="" className="w-6 h-6 rounded-full object-cover border border-slate-200" />
                                        ) : (
                                            <span className="material-symbols-outlined text-green-500 text-xl">check_circle</span>
                                        )
                                    ) : isVerifying ? (
                                        <div className="w-4 h-4 border-2 border-slate-300 border-t-orange-500 rounded-full animate-spin"></div>
                                    ) : (
                                        <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            type="email"
                                            className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-300"
                                            placeholder="Saisir l'adresse email..."
                                            value={selectedInspecteurEmail}
                                            onChange={e => setSelectedInspecteurEmail(e.target.value)}
                                        />
                                        {inspectorValid && inspectorNom && (
                                            <p className="text-[10px] font-black text-green-600 mt-0.5">{inspectorNom}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Priorité */}
                            <div className="flex-[0.8] w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Priorité</p>
                                <select
                                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                                    value={priorite}
                                    onChange={e => setPriorite(e.target.value)}
                                >
                                    {PRIORITE_OPTIONS.map(p => <option key={p}>{p === 'Haute' ? '🔴' : p === 'Normale' ? '🟡' : '🔵'} {p}</option>)}
                                </select>
                            </div>

                            {/* Date Échéance */}
                            <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Échéance</p>
                                <input
                                    type="date"
                                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                                    value={dateEcheance}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => handleDateChange(e.target.value)}
                                />
                            </div>

                            {/* Heure Échéance */}
                            <div className="flex-[0.7] w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Heure</p>
                                <input
                                    type="time"
                                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                                    value={heureEcheance}
                                    onChange={e => handleHeureChange(e.target.value)}
                                />
                            </div>

                            {/* Send Button */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                                <button
                                    onClick={handleSendMission}
                                    disabled={isSending || sendSuccess || !selectedInspecteurEmail || !!dateError}
                                    className={`w-full md:w-16 h-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${sendSuccess ? 'bg-green-500 text-white' :
                                        dateError ? 'bg-slate-300 text-white cursor-not-allowed' :
                                            'bg-orange-500 hover:bg-orange-600 hover:shadow-md text-white'
                                        }`}
                                >
                                    {isSending ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : sendSuccess ? (
                                        <span className="material-symbols-outlined font-black text-xl">check</span>
                                    ) : (
                                        <span className="material-symbols-outlined font-black text-xl -rotate-45 ml-1">send</span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Date/time error */}
                        {dateError && (
                            <div className="mt-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-black flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">schedule</span>
                                {dateError}
                            </div>
                        )}
                    </div>

                    {/* Global Mission Table */}
                    <div className="mission-history-container">
                        <div className="p-8 border-b border-slate-50">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-black text-slate-900 text-xl tracking-tight">Historique Global des Missions</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pilotage et filtrage dynamique de la flotte</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                                    <div className="flex flex-wrap bg-slate-50 p-1 rounded-xl border border-slate-100 w-full sm:w-auto">
                                        {[['toutes', 'TOUTES'], ['cours', 'EN COURS'], ['retard', '  EN RETARD'], ['chevées', 'ACHEVÉES'], ['pas_achevées', 'PAS ACHEVÉES']].map(([val, label]) => (
                                            <button key={val} onClick={() => setActiveFilter(val)}
                                                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeFilter === val
                                                    ? val === 'retard'
                                                        ? 'bg-white shadow-sm text-red-600'
                                                        : 'bg-white shadow-sm text-orange-600'
                                                    : 'text-slate-400'
                                                    }`}>
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="search-box-premium w-full lg:w-64">
                                        <span className="material-symbols-outlined">search</span>
                                        <input type="text" placeholder="ID, Inspecteur, Pièce..." value={searchQuery}
                                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="w-full" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto w-full" style={{ minHeight: '440px' }}>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        {['MISSION ID', 'INSPECTEUR', 'PIÈCE', 'DATE ÉCHÉANCE', 'STATUT', 'PRIORITÉ', 'ACTIONS'].map(h => (
                                            <th key={h} className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingMissions ? (
                                        <tr><td colSpan="7" className="text-center py-12 text-slate-400 text-sm font-bold">Chargement...</td></tr>
                                    ) : paginatedMissions.length > 0 ? paginatedMissions.map(m => {
                                        const sc = statusClass(m.statut);
                                        const pb = prioriteBadge(m.priorite);
                                        return (
                                            <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                <td className="py-4 px-6 align-middle">
                                                    <span className="font-bold text-slate-800 text-xs">{m.missionRef || `MSN-${m.id}`}</span>
                                                </td>
                                                <td className="py-4 px-6 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                                            {m.inspecteurPhoto ? (
                                                                <img src={m.inspecteurPhoto.startsWith('data:') ? m.inspecteurPhoto : `data:image/jpeg;base64,${m.inspecteurPhoto}`}
                                                                    alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600">
                                                                    {(m.inspecteurNom || 'U').split(' ').map(n => n[0]).join('')}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-black text-slate-700 uppercase tracking-widest leading-tight block">{m.inspecteurNom || m.inspecteurEmail}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{m.inspecteurEmail}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 align-middle">
                                                    <span className="font-bold text-slate-800 text-sm">{m.pieceAttendue || m.titre}</span>
                                                </td>
                                                <td className="py-4 px-6 align-middle">
                                                    <div>
                                                        <span className="text-xs font-semibold text-slate-700">{m.dateEcheance || '—'}</span>
                                                        {m.heureEcheance && <span className="ml-1 text-[10px] font-black text-orange-500"> {m.heureEcheance}</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 align-middle">
                                                    <span className={`status-badge-new ${sc === 'terminee' ? 'conforme' :
                                                        sc === 'en-cours' ? 'en-cours' :
                                                            sc === 'en-retard' ? 'non-conforme' :
                                                                'non-conforme'
                                                        }`}>
                                                        {sc === 'en-retard' && '  '}{m.statut}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 align-middle">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-black ${pb.cls}`}>
                                                        {pb.icon} {m.priorite}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 align-middle text-right">
                                                    <button onClick={() => handleDelete(m.id, m.missionRef)}
                                                        className="w-8 h-8 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ml-auto">
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="7" className="text-center py-20">
                                                <div className="flex flex-col items-center opacity-20">
                                                    <span className="material-symbols-outlined text-6xl">search_off</span>
                                                    <p className="font-black mt-4">Aucune mission ne correspond à vos critères</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden p-4 space-y-4">
                            {paginatedMissions.map(m => (
                                <div key={m.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 flex-shrink-0 bg-orange-100 flex items-center justify-center text-[10px] font-black text-orange-600">
                                                {m.inspecteurPhoto ? (
                                                    <img src={m.inspecteurPhoto.startsWith('data:') ? m.inspecteurPhoto : `data:image/jpeg;base64,${m.inspecteurPhoto}`} alt="" className="w-full h-full object-cover" />
                                                ) : (m.inspecteurNom || 'U').split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">{m.inspecteurNom || m.inspecteurEmail}</p>
                                                <p className="text-[10px] font-bold text-slate-400">{m.missionRef || `MSN-${m.id}`}</p>
                                            </div>
                                        </div>
                                        <span className={`status-badge-new ${statusClass(m.statut) === 'terminee' ? 'conforme' : statusClass(m.statut) === 'en-cours' ? 'en-cours' : 'non-conforme'}`}>
                                            {m.statut}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pièce</p>
                                            <p className="text-sm font-bold text-slate-700">{m.pieceAttendue || m.titre}</p>
                                        </div>
                                        <button onClick={() => handleDelete(m.id, m.missionRef)} className="w-8 h-8 text-slate-300 hover:text-red-500 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {filteredMissions.length > 0 && (
                            <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                    Affichage de <span className="text-slate-900">{displayStart}-{displayEnd}</span> sur <span className="text-slate-900">{filteredMissions.length}</span> missions
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-orange-200 text-slate-600'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                                    </button>

                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => {
                                            const p = i + 1;
                                            // Show first, last, and pages around current
                                            if (totalPages > 7 && p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
                                                if (Math.abs(p - currentPage) === 2) return <span key={p} className="px-1 text-slate-300">...</span>;
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={p}
                                                    onClick={() => setCurrentPage(p)}
                                                    className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all ${currentPage === p ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-orange-200 text-slate-600'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AdminLayout>
            {/* ── Delete Confirmation Modal ── */}
            {missionToDelete && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '24px', padding: '2.5rem',
                        maxWidth: '440px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                        animation: 'slideUp 0.2s ease'
                    }}>
                        {/* Icon */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: '16px',
                                background: '#fef2f2', border: '2px solid #fecaca',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                                <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '1.6rem' }}>delete_forever</span>
                            </div>
                            <div>
                                <p style={{ fontSize: '1.1rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em' }}>
                                    Confirmer la suppression
                                </p>
                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                                    Action irréversible
                                </p>
                            </div>
                        </div>

                        {/* Message */}
                        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.7, marginBottom: '2rem' }}>
                            Voulez-vous vraiment supprimer la mission{' '}
                            <strong style={{ color: '#0f172a', fontWeight: 900 }}>{missionToDelete.ref}</strong> ?
                            {' '}Cette action est irréversible et supprimera la mission du système pour tous les utilisateurs.
                        </p>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button
                                onClick={() => setMissionToDelete(null)}
                                disabled={isDeleting}
                                style={{
                                    flex: 1, padding: '0.875rem', borderRadius: '14px',
                                    background: '#f1f5f9', border: 'none', cursor: 'pointer',
                                    fontWeight: 800, fontSize: '0.85rem', color: '#64748b',
                                    transition: 'background 0.2s'
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
                                onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                style={{
                                    flex: 1, padding: '0.875rem', borderRadius: '14px',
                                    background: isDeleting ? '#fca5a5' : '#dc2626',
                                    border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer',
                                    fontWeight: 800, fontSize: '0.85rem', color: 'white',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    transition: 'background 0.2s'
                                }}
                            >
                                {isDeleting ? (
                                    <>
                                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                        Suppression...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete_forever</span>
                                        Confirmer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Success Toast ── */}
            {deleteToast && (
                <div style={{
                    position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
                    background: '#1e293b', color: 'white', padding: '1rem 1.5rem',
                    borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '0.75rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)', fontWeight: 700, fontSize: '0.85rem',
                    animation: 'slideUp 0.3s ease', maxWidth: '400px'
                }}>
                    <span className="material-symbols-outlined" style={{ color: '#4ade80', flexShrink: 0 }}>check_circle</span>
                    {deleteToast}
                </div>
            )}
        </>
    );
};

export default MissionManagementPage;
