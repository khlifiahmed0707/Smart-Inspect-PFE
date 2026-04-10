import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import './UserManagementPage.css';

const UserManagementPage = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Tous');
    // Track all known admin emails to protect them in the UI
    const [adminEmails, setAdminEmails] = useState(() => {
        const stored = localStorage.getItem('userEmail');
        return stored ? [stored.toLowerCase()] : [];
    });

    useEffect(() => {
        fetchUsers();
        fetchAdminEmails();
    }, []);

    // Fetch all admin emails from the backend to always be up-to-date
    const fetchAdminEmails = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8081/api/admin/me');
            if (response.ok) {
                const data = await response.json();
                if (data.email) {
                    setAdminEmails(prev => {
                        const updated = [...new Set([...prev, data.email.toLowerCase()])];
                        return updated;
                    });
                }
            }
        } catch (e) {
            // silently fail — local storage fallback is already set
        }
    };

    const isAdmin = (email) =>
        adminEmails.includes((email || '').toLowerCase());

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://127.0.0.1:8081/api/personnes');
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Erreur chargement utilisateurs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (email) => {
        try {
            const response = await fetch(`http://127.0.0.1:8081/api/personnes/${email}/toggle-status`, { method: 'PUT' });
            if (response.ok) {
                setUsers(users.map(u => u.email === email ? { ...u, enabled: !u.enabled } : u));
            }
        } catch (error) {
            console.error("Erreur toggle statut:", error);
        }
    };

    const filteredUsers = users.filter(user => {
        const fullName = `${user.prenom} ${user.nom}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        const matchesSearch = fullName.includes(search)
            || user.email.toLowerCase().includes(search)
            || (user.numeroCarteIdentite || '').includes(search);
        const matchesStatus = statusFilter === 'Tous'
            || (statusFilter === 'Actif' && user.enabled)
            || (statusFilter === 'Inactif' && !user.enabled);
        return matchesSearch && matchesStatus;
    });

    const avatar = (user) => user.photo
        ? <img src={user.photo.startsWith('data:') ? user.photo : `data:image/jpeg;base64,${user.photo}`} alt="User" className="w-full h-full object-cover" />
        : `${(user.prenom || '?')[0]}${(user.nom || '?')[0]}`;

    return (
        <AdminLayout activePage="users">
            <div className="admin-content-premium">
                {/* Header */}
                <div className="page-intro-admin" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.25rem' }}>
                            Situation des Utilisateurs
                        </h2>
                        <p style={{ color: '#64748b', fontWeight: 500 }}>
                            Gestion centralisée des accès inspecteurs et des statuts de compte.
                        </p>
                    </div>
                    <button className="btn-add-inspector-premium" onClick={() => navigate('/admin/user-action')}>
                        <span className="material-symbols-outlined">person_add</span>
                        Nouveau Compte
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="um-controls-premium">
                    <div className="search-group-premium">
                        <div className="search-box-premium">
                            <span className="material-symbols-outlined">search</span>
                            <input
                                type="text"
                                placeholder="Nom, e-mail ou matricule..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filters-premium">
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="Tous">Tous les statuts</option>
                                <option value="Actif">Actifs</option>
                                <option value="Inactif">Inactifs</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Chargement des comptes...</p>
                    </div>
                ) : (
                    <>
                        {/* ── Desktop Table ── */}
                        <div className="um-table-card">
                            <table className="premium-table">
                                <thead>
                                    <tr>
                                        <th>Identité</th>
                                        <th>E-mail</th>
                                        <th>CIN / Matricule</th>
                                        <th>Adresse</th>
                                        <th>État</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.length > 0 ? filteredUsers.map(user => (
                                        <tr key={user.email} className="hover-row">
                                            {/* Identité */}
                                            <td>
                                                <div className="user-identity-cell">
                                                    <div className="avatar-box">
                                                        {avatar(user)}
                                                    </div>
                                                    <div className="name-box">
                                                        <span className="full-name">{user.prenom} {user.nom}</span>
                                                        <span className="role-tag">Inspecteur</span>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* E-mail */}
                                            <td>
                                                <div className="contact-box">
                                                    <span className="email-text">{user.email}</span>
                                                </div>
                                            </td>
                                            {/* CIN */}
                                            <td>
                                                <span className="matricule-tag">{user.numeroCarteIdentite || '—'}</span>
                                            </td>
                                            {/* ADRESSE */}
                                            <td>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                                    {user.adresse || <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>Non renseignée</span>}
                                                </span>
                                            </td>
                                            {/* État */}
                                            <td>
                                                <span className={`status-pill ${user.enabled ? 'active' : 'inactive'}`}>
                                                    {user.enabled ? 'Actif' : 'Désactivé'}
                                                </span>
                                            </td>
                                            {/* Actions */}
                                            <td>
                                                <div className="actions-flex">
                                                    {isAdmin(user.email) ? (
                                                        <div className="admin-lock-badge" style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            background: '#fff7ed',
                                                            color: '#c2410c',
                                                            padding: '0.4rem 0.8rem',
                                                            borderOpacity: 0.1,
                                                            borderRadius: '8px',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 800
                                                        }}>
                                                            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>lock</span>
                                                            PROTÉGÉ
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <button
                                                                className={`btn-action-circle ${user.enabled ? 'deactivate' : 'activate'}`}
                                                                onClick={() => handleToggleStatus(user.email)}
                                                                title={user.enabled ? 'Bloquer' : 'Activer'}
                                                            >
                                                                <span className="material-symbols-outlined">
                                                                    {user.enabled ? 'no_accounts' : 'how_to_reg'}
                                                                </span>
                                                            </button>
                                                            <button
                                                                className="btn-action-circle edit"
                                                                onClick={() => navigate('/admin/user-action', { state: { editUser: user } })}
                                                                title="Modifier"
                                                            >
                                                                <span className="material-symbols-outlined">edit_note</span>
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: 600 }}>
                                                Aucun inspecteur trouvé.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* ── Mobile Cards ── */}
                        <div className="users-grid-mobile">
                            {filteredUsers.map(user => (
                                <div key={user.email} className="user-mobile-card">
                                    <div className="card-header-um">
                                        <div className="avatar-um-mobile">
                                            {avatar(user)}
                                        </div>
                                        <div className="identity-um-mobile">
                                            <span className="name-um">{user.prenom} {user.nom}</span>
                                            <span className={`status-pill small ${user.enabled ? 'active' : 'inactive'}`}>
                                                {user.enabled ? 'Actif' : 'Désactivé'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="card-details-um">
                                        <div className="detail-item-um">
                                            <span className="label">E-mail :</span>
                                            <span className="value">{user.email}</span>
                                        </div>
                                        <div className="detail-item-um">
                                            <span className="label">CIN :</span>
                                            <span className="value">{user.numeroCarteIdentite || '—'}</span>
                                        </div>
                                        <div className="detail-item-um">
                                            <span className="label">Adresse :</span>
                                            <span className="value">{user.adresse || 'Non renseignée'}</span>
                                        </div>
                                    </div>
                                    <div className="card-footer-um">
                                        {isAdmin(user.email) ? (
                                            <div style={{
                                                width: '100%',
                                                textAlign: 'center',
                                                padding: '0.75rem',
                                                background: '#f8fafc',
                                                borderRadius: '10px',
                                                color: '#64748b',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem',
                                                border: '1px dashed #cbd5e1'
                                            }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>security</span>
                                                COMPTE ADMIN PROTÉGÉ
                                            </div>
                                        ) : (
                                            <>
                                                <button className="btn-edit-mobile-um" onClick={() => navigate('/admin/user-action', { state: { editUser: user } })}>
                                                    <span className="material-symbols-outlined">edit</span> Modifier
                                                </button>
                                                <button
                                                    className={`btn-toggle-mobile-um ${user.enabled ? 'deactivate' : 'activate'}`}
                                                    onClick={() => handleToggleStatus(user.email)}
                                                >
                                                    <span className="material-symbols-outlined">{user.enabled ? 'block' : 'check_circle'}</span>
                                                    {user.enabled ? 'Bloquer' : 'Activer'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default UserManagementPage;
