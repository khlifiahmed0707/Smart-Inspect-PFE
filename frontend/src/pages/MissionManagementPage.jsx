import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import './MissionManagementPage.css';

const MissionManagementPage = () => {
    const navigate = useNavigate();

    // Quick Action Row States
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [selectedInspector, setSelectedInspector] = useState('Jean Dupont');

    // Consolidated Mock Data for Global History
    const allMissions = [
        { 
            id: "MSN-901-P", 
            inspector: "Marc Volkov", 
            email: "m.volkov@inspect.com", 
            piece: "VAL-HYD", 
            pieceId: "HYD-Z2", 
            description: "Vérification des joints hydrauliques...", 
            date: "Aujourd'hui, 08:30", 
            status: "En cours", 
            progress: 75,
            statusClass: "active-orange"
        },
        { 
            id: "MSN-882-L", 
            inspector: "Sarah Miller", 
            email: "s.miller@inspect.com", 
            piece: "TRB-45", 
            pieceId: "TB-X1", 
            description: "Audit structurel standard de fin de cycle.", 
            date: "Hier, 16:45", 
            status: "Terminée", 
            progress: 100,
            statusClass: "background-slate"
        },
        { 
            id: "MSN-771-X", 
            inspector: "Ahmed Khlifi", 
            email: "a.khlifi@inspect.com", 
            piece: "PCB-X", 
            pieceId: "ELEC-MOD", 
            description: "-", 
            date: "08 Oct, 10:20", 
            status: "Annulée", 
            progress: 0,
            statusClass: "inactive"
        },
        { 
            id: "MSN-654-K", 
            inspector: "Jean Dupont", 
            email: "j.dupont@inspect.com", 
            piece: "FAN-A1", 
            pieceId: "PROP-99", 
            description: "Test de vibration haute fréquence.", 
            date: "12 Oct, 09:15", 
            status: "En retard", 
            progress: 100,
            statusClass: "inactive"
        }
    ];

    // Filter and Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('toutes');

    // Filtering Logic
    const getFilteredMissions = () => {
        return allMissions.filter(mission => {
            const matchesSearch = 
                mission.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mission.inspector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mission.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mission.piece.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mission.pieceId.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (activeFilter === 'chevées') return mission.status === 'Terminée';
            if (activeFilter === 'cours') return mission.status === 'En cours';
            if (activeFilter === 'pas_achevées') return mission.status !== 'Terminée';
            
            return true; // 'toutes'
        });
    };

    const filteredMissions = getFilteredMissions();

    const handleSendMission = () => {
        setIsSending(true);
        // Simulate API Call
        setTimeout(() => {
            setIsSending(false);
            setSendSuccess(true);
            
            // Reset success animation after a few seconds
            setTimeout(() => {
                setSendSuccess(false);
            }, 3500);
        }, 800);
    };

    return (
        <AdminLayout activePage="missions">
            <div className="admin-content-premium">
                <div className="page-intro-admin">
                    <h2 className="text-2xl font-black text-slate-900">Gestion des Missions</h2>
                    <p className="text-slate-500 font-medium">Surveillez, affectez et optimisez les inspections d'atelier en temps réel.</p>
                </div>

                {/* Stats de Mission Rapides */}
                <div className="stats-grid-premium mb-8">
                    <div className="stat-card-premium">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-orange-50 text-orange-600">
                                <span className="material-symbols-outlined">pending_actions</span>
                            </div>
                            <span className="stat-trend-tag">+5%</span>
                        </div>
                        <div className="card-bottom-info">
                            <p className="stat-label">Missions Actives</p>
                            <p className="stat-val text-orange-600">24</p>
                        </div>
                    </div>
                    <div className="stat-card-premium">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-red-50 text-red-600">
                                <span className="material-symbols-outlined">schedule</span>
                            </div>
                            <span className="stat-trend-tag bg-red-100 text-red-600">Alerte</span>
                        </div>
                        <div className="card-bottom-info">
                            <p className="stat-label">En Retard</p>
                            <p className="stat-val text-red-600">03</p>
                        </div>
                    </div>
                    <div className="stat-card-premium">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-green-50 text-green-600">
                                <span className="material-symbols-outlined">task_alt</span>
                            </div>
                            <span className="stat-trend-tag">+12%</span>
                        </div>
                        <div className="card-bottom-info">
                            <p className="stat-label">Terminées (Jour)</p>
                            <p className="stat-val text-green-600">18</p>
                        </div>
                    </div>
                </div>



                {/* Quick Action Row ⚡ */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-10">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                        
                        {/* 1. Sélecteur de Pièce (Visual) */}
                        <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-2 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                <img src="https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=100&q=80" alt="Piece" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Pièce Cible</p>
                                <select className="w-full bg-transparent text-sm font-black text-slate-900 outline-none cursor-pointer">
                                    <option>Turbine Fan A-1</option>
                                    <option>Exhaust Nozzle</option>
                                    <option>Control PCB</option>
                                </select>
                            </div>
                        </div>

                        {/* 2. Sélecteur d'Atelier */}
                        <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[10px]">location_on</span> Atelier
                            </p>
                            <select className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer">
                                <option>Atelier 1 - Prod</option>
                                <option>Atelier 4 - Maint</option>
                                <option>Hangar Central</option>
                            </select>
                        </div>

                        {/* 3. Sélecteur Inspecteur (Status-Ready) */}
                        <div className="flex-[1.5] w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Opérateur Assigné</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                <select 
                                    className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer"
                                    value={selectedInspector}
                                    onChange={(e) => setSelectedInspector(e.target.value)}
                                >
                                    <option>Jean Dupont</option>
                                    <option>Sarah Miller</option>
                                    <option>Ahmed Khlifi</option>
                                </select>
                            </div>
                        </div>

                        {/* 4. Niveau Priorité */}
                        <div className="flex-[0.8] w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Priorité</p>
                            <select className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer">
                                <option>🔴 Haute</option>
                                <option>🟡 Normale</option>
                                <option>🔵 Basse</option>
                            </select>
                        </div>

                        {/* 5. Date */}
                        <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Échéance</p>
                            <input 
                                type="date" 
                                className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none cursor-pointer" 
                                defaultValue={new Date().toISOString().split('T')[0]} 
                            />
                        </div>

                        {/* 6. ID Mission (Read-Only) */}
                        <div className="flex-[0.8] w-full bg-slate-100/50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center hidden lg:flex">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Réf Mission</p>
                            <input 
                                type="text" 
                                readOnly 
                                value="MS-26-042" 
                                className="w-full bg-transparent text-sm font-black text-slate-500 outline-none cursor-default" 
                            />
                        </div>

                        {/* 7. Action Button + Success Feedback */}
                        <div className="flex items-center gap-4 flex-shrink-0">
                            {sendSuccess && (
                                <div className="hidden xl:flex items-center gap-2 text-green-600 animate-slideRight">
                                    <span className="material-symbols-outlined text-sm font-black">verified</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Mission envoyée avec succès !</span>
                                </div>
                            )}
                            <button 
                                onClick={handleSendMission}
                                disabled={isSending || sendSuccess}
                                className={`w-full md:w-16 h-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                    sendSuccess ? 'bg-green-500 text-white' : 
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
                </div>

                {/* --- GLOBAL MISSION HISTORY SECTION --- */}
                <div className="mission-history-container">
                    <div className="p-8 border-b border-slate-50">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                            <div>
                                <h4 className="font-black text-slate-900 text-xl tracking-tight">Historique Global des Missions</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pilotage et filtrage dynamique de la flotte</p>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
                                {/* Dynamic Status Filters */}
                                <div className="flex flex-wrap bg-slate-50 p-1 rounded-xl border border-slate-100 w-full sm:w-auto overflow-x-auto">
                                    <button 
                                        onClick={() => setActiveFilter('toutes')}
                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeFilter === 'toutes' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
                                    >
                                        TOUTES
                                    </button>
                                    <button 
                                        onClick={() => setActiveFilter('chevées')}
                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeFilter === 'chevées' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
                                    >
                                        ACHEVÉES
                                    </button>
                                    <button 
                                        onClick={() => setActiveFilter('cours')}
                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeFilter === 'cours' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
                                    >
                                        EN COURS
                                    </button>
                                    <button 
                                        onClick={() => setActiveFilter('pas_achevées')}
                                        className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black transition-all ${activeFilter === 'pas_achevées' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-400'}`}
                                    >
                                        PAS ACHEVÉES
                                    </button>
                                </div>

                                {/* Intelligent Global Search */}
                                <div className="search-box-premium w-full lg:w-64">
                                    <span className="material-symbols-outlined">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="ID, Inspecteur, Pièce..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="premium-table">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="text-slate-500">MISSION ID</th>
                                    <th className="text-slate-500">INSPECTEUR</th>
                                    <th className="text-slate-500">PIÈCE</th>
                                    <th className="text-slate-500">DESCRIPTION</th>
                                    <th className="text-slate-500">DATE</th>
                                    <th className="text-slate-500">STATUT</th>
                                    <th className="text-right text-slate-500">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMissions.length > 0 ? filteredMissions.map((mission) => (
                                    <tr key={mission.id}>
                                        <td><span className="matricule-tag">{mission.id}</span></td>
                                        <td>
                                            <div className="user-identity-cell">
                                                <div className="avatar-box">{mission.inspector.split(' ').map(n => n[0]).join('')}</div>
                                                <div className="name-box">
                                                    <span className="full-name">{mission.inspector}</span>
                                                    <span className="role-tag">{mission.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="piece-info-cell flex items-center gap-2">
                                                <span className="material-symbols-outlined text-slate-400">
                                                    {mission.piece.includes('VAL') ? 'memory' : mission.piece.includes('TRB') ? 'precision_manufacturing' : 'settings_input_component'}
                                                </span>
                                                <div>
                                                    <span className="font-bold text-slate-700 block leading-none">{mission.piece}</span>
                                                    <span className="text-[10px] font-bold text-slate-300">{mission.pieceId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p className="max-w-[200px] text-xs font-semibold text-slate-400 text-left truncate">{mission.description}</p>
                                        </td>
                                        <td><span className="text-xs font-semibold text-slate-500">{mission.date}</span></td>
                                        <td><span className={`status-pill ${mission.statusClass}`}>{mission.status}</span></td>
                                        <td className="text-right">
                                            <button className="btn-action-circle delete"><span className="material-symbols-outlined">delete</span></button>
                                        </td>
                                    </tr>
                                )) : (
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

                    {/* Mobile Card View (Synced with Filter) */}
                    <div className="block md:hidden p-4 space-y-4">
                        {filteredMissions.length > 0 ? filteredMissions.map((mission) => (
                            <div key={mission.id} className="bg-slate-50 border border-slate-100 rounded-xl p-5 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="matricule-tag">{mission.id}</span>
                                    <span className={`status-pill ${mission.statusClass}`}>{mission.status}</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-black border border-slate-100">
                                            {mission.inspector.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inspecteur</p>
                                            <p className="text-sm font-bold text-slate-800">{mission.inspector}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pièce</p>
                                            <p className="text-sm font-bold text-slate-700">{mission.piece}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</p>
                                            <p className="text-sm font-bold text-slate-700">{mission.date}</p>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t border-slate-200/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                                        <p className="text-xs font-medium text-slate-500 leading-relaxed">{mission.description}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10 opacity-30">
                                <p className="text-sm font-bold italic">Aucun résultat trouvé pour votre recherche.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default MissionManagementPage;
