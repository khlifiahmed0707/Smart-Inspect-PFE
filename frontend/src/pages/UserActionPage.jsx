import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import './UserActionPage.css';

const UserActionPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('add'); // add, update, delete
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        confirmPassword: '',
        numeroCarteIdentite: '',
        enabled: true
    });

    const [searchCin, setSearchCin] = useState('');
    const [foundUser, setFoundUser] = useState(null);
    const [adminEmails, setAdminEmails] = useState([]);

    React.useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8081/api/admin/me');
                if (response.ok) {
                    const data = await response.json();
                    if (data.email) setAdminEmails([data.email.toLowerCase(), 'ahmedkhlifi0707@gmail.com']);
                }
            } catch (e) {}
        };
        fetchAdmin();
    }, []);

    const isAdmin = (email) => 
        adminEmails.includes((email || '').toLowerCase().trim());

    const resetForm = (keepMessage = false) => {
        setFormData({
            nom: '',
            prenom: '',
            email: '',
            password: '',
            confirmPassword: '',
            numeroCarteIdentite: '',
            enabled: true
        });
        setFoundUser(null);
        setSearchCin('');
        if (!keepMessage) {
            setMessage({ type: '', text: '' });
        }
    };

    const handleSearchByCin = async () => {
        if (!searchCin) return;
        setLoading(true);
        try {
            const response = await fetch(`http://127.0.0.1:8081/api/personnes/by-cin/${searchCin}`);
            if (response.ok) {
                const user = await response.json();
                
                // --- PROTECTION ADMIN ---
                if (isAdmin(user.email)) {
                    setMessage({ type: 'error', text: 'ACTION REFUSÉE : Ce compte est un compte administrateur protégé.' });
                    setFoundUser(null);
                    setFormData(prev => ({ ...prev, email: user.email })); // Keep email to show warning
                    return;
                }
                // -----------------------

                setFoundUser(user);
                setFormData({
                    nom: user.nom,
                    prenom: user.prenom,
                    email: user.email,
                    password: user.password,
                    confirmPassword: user.password,
                    numeroCarteIdentite: user.numeroCarteIdentite,
                    enabled: user.enabled
                });
                setMessage({ type: 'success', text: 'Utilisateur trouvé !' });
            } else {
                setMessage({ type: 'error', text: 'Aucun utilisateur trouvé avec ce CIN.' });
                setFoundUser(null);
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur lors de la recherche.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (isAdmin(formData.email)) {
            setMessage({ type: 'error', text: "L'adresse email est réservée à l'administration." });
            return;
        }

        setLoading(true);
        try {
            let url = 'http://127.0.0.1:8081/api/personnes';
            let method = 'POST';

            if (activeTab === 'update') {
                url = `http://127.0.0.1:8081/api/personnes/update/${foundUser.email}`;
                method = 'PUT';
            } else if (activeTab === 'delete') {
                url = `http://127.0.0.1:8081/api/personnes/${foundUser.email}`;
                method = 'DELETE';
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: activeTab === 'delete' ? null : JSON.stringify(formData)
            });

            if (response.ok) {
                let successMsg = activeTab === 'add' ? 'ajout avec succes !' : 
                               activeTab === 'update' ? 'modification avec succees' : 
                               'la suppression fait avec success !';
                setMessage({ type: 'success', text: successMsg });
                if (activeTab !== 'update') resetForm(true);
            } else {
                const errorText = await response.text();
                setMessage({ type: 'error', text: errorText || 'Une erreur est survenue.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erreur de connexion au serveur.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout activePage="user-action">
            <div className="admin-content-premium">
                <div className="page-intro-admin">
                    <h2 className="text-2xl font-black text-slate-900">Gestion des Comptes</h2>
                    <p className="text-slate-500 font-medium">Contrôle complet sur les profils et les identifiants de connexion.</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="action-card-premium-wrapper" style={{ width: '100%', maxWidth: '780px' }}>
                    <div className="action-card-white shadow-sm border border-slate-100 rounded-3xl overflow-hidden">
                        <div className="tabs-container-premium">
                            <button className={`tab-btn-premium ${activeTab === 'add' ? 'active' : ''}`} onClick={() => { setActiveTab('add'); resetForm(); }}>
                                <span className="material-symbols-outlined">person_add</span> Création
                            </button>
                            <button className={`tab-btn-premium ${activeTab === 'update' ? 'active' : ''}`} onClick={() => { setActiveTab('update'); resetForm(); }}>
                                <span className="material-symbols-outlined">edit</span> Édition
                            </button>
                            <button className={`tab-btn-premium ${activeTab === 'delete' ? 'active' : ''}`} onClick={() => { setActiveTab('delete'); resetForm(); }}>
                                <span className="material-symbols-outlined">delete_forever</span> Suppression
                            </button>
                        </div>

                        <div className="action-body-premium p-8">
                            <div className="action-header-info mb-8">
                                <h3 className="text-xl font-black text-slate-900">
                                    {activeTab === 'add' ? 'Nouvel Inspecteur' :
                                        activeTab === 'update' ? 'Mettre à jour le profil' : 'Révoquer un accès'}
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">
                                    {activeTab === 'add' ? 'Enregistrez un nouveau membre dans le cockpit.' :
                                        activeTab === 'update' ? 'Modifiez les informations confidentielles ou le statut.' :
                                            'Attention : Cette action est irréversible et bloque l\'accès.'}
                                </p>
                            </div>

                            {isAdmin(formData.email) && (
                                <div className="admin-protection-alert mb-6" style={{
                                    background: '#fff1f2',
                                    border: '1px solid #fda4af',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    color: '#be123c'
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>security</span>
                                    <div>
                                        <p style={{ fontWeight: 800, fontSize: '0.85rem', margin: 0 }}>COMPTE ADMINISTRATEUR PROTÉGÉ</p>
                                        <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.8 }}>
                                            Ce compte ne peut pas être géré via cette interface utilisateur standard.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'update' || activeTab === 'delete') && (
                                <div className="search-section-premium mb-8">
                                    <div className="search-box-premium-action">
                                        <input
                                            type="text"
                                            placeholder="Entrez le CIN de l'utilisateur..."
                                            value={searchCin}
                                            onChange={(e) => setSearchCin(e.target.value)}
                                        />
                                        <button className="btn-search-action" onClick={handleSearchByCin} disabled={loading}>
                                            {loading ? <div className="spinner-mini"></div> : <span className="material-symbols-outlined">search</span>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {message.text && (
                                <div className={`alert-box-premium ${message.type} mb-8`}>
                                    <span className="material-symbols-outlined">
                                        {message.type === 'success' ? 'check_circle' : 'error'}
                                    </span>
                                    {message.text}
                                </div>
                            )}

                            {(activeTab === 'add' || foundUser) && (
                                <form className="form-premium-action mt-8" onSubmit={handleSubmit}>
                                    <div className="form-grid-premium">
                                        <div className="form-group-admin">
                                            <label>Prénom</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.prenom}
                                                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                                                disabled={activeTab === 'delete'}
                                                placeholder="ex: Jean"
                                            />
                                        </div>
                                        <div className="form-group-admin">
                                            <label>Nom de famille</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.nom}
                                                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                                disabled={activeTab === 'delete'}
                                                placeholder="ex: Dupont"
                                            />
                                        </div>
                                        <div className="form-group-admin span-2">
                                            <label>Adresse E-mail professionnelle</label>
                                            <input
                                                type="email"
                                                required
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                disabled={activeTab === 'delete'}
                                                placeholder="inspecteur@smart-inspect.com"
                                            />
                                        </div>
                                        
                                        {activeTab === 'add' && (
                                            <div className="form-group-admin span-2">
                                                <label>Numéro de Carte d'Identité (CIN)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={formData.numeroCarteIdentite}
                                                    onChange={(e) => setFormData({ ...formData, numeroCarteIdentite: e.target.value })}
                                                    placeholder="8 chiffres"
                                                />
                                            </div>
                                        )}

                                        {activeTab !== 'delete' && (
                                            <>
                                                <div className="form-group-admin">
                                                    <label>Nouveau Mot de passe</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                                <div className="form-group-admin">
                                                    <label>Confirmer le mot de passe</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={formData.confirmPassword}
                                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                        placeholder="••••••••"
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="form-footer-action-premium mt-12 flex items-center justify-between border-t border-slate-50 pt-8">
                                        <div className="status-indicator-admin flex items-center gap-4">
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Statut :</span>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={formData.enabled}
                                                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                                                    disabled={activeTab === 'delete'}
                                                />
                                                <div className={`w-12 h-6 rounded-full p-1 transition-all ${formData.enabled ? 'bg-orange-500' : 'bg-slate-200'}`}>
                                                    <div className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${formData.enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-tighter ${formData.enabled ? 'text-orange-600' : 'text-slate-400'}`}>
                                                    {formData.enabled ? 'Compte Actif' : 'Compte Bloqué'}
                                                </span>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                            <button
                                                type="button"
                                                className="btn-mgt-secondary-slate"
                                                style={{ padding: '0.7rem 1.5rem' }}
                                                onClick={() => navigate('/admin/users')}
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn-mgt-primary-orange"
                                                style={{
                                                    padding: '0.7rem 1.75rem',
                                                    ...(activeTab === 'delete' ? {
                                                        background: '#dc2626',
                                                        boxShadow: '0 4px 12px rgba(220,38,38,0.2)'
                                                    } : {})
                                                }}
                                                disabled={loading}
                                            >
                                                {loading ? 'Traitement...' :
                                                    activeTab === 'add' ? 'Créer le compte' :
                                                        activeTab === 'update' ? 'Mettre à jour' : "Révoquer l'accès"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default UserActionPage;
