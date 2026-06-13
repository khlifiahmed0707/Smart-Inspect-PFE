import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = ({ activePage, isCollapsed, isMobileOpen, onToggleCollapse, onToggleMobileMenu }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const userRole = localStorage.getItem('userRole') || 'ADMIN'; // Default to ADMIN if not found

    const menuItems = [
        { icon: "dashboard", label: "Tableau de bord", path: "/admin", key: "dashboard" },
        { icon: "group", label: "Situation des Utilisateurs", desc: "Consulter les statuts des comptes", path: "/admin/users", key: "users" },
        { icon: "person_add", label: "Gestion des Utilisateurs", desc: "Ajouter/Modifier/Supprimer", path: "/admin/user-action", key: "user-action", restricted: true },
        { icon: "history", label: "Inspection des inspecteurs", path: "/admin/analytics", key: "analytics" },
        { icon: "assignment_turned_in", label: "Gestion des Missions", desc: "Suivi des inspections en temps réel", path: "/admin/missions", key: "missions" }
    ].filter(item => {
        if (userRole === 'SUPER_ADMIN' && item.restricted) return false;
        return true;
    });

    return (
        <>
            {/* Mobile dark overlay */}
            {isMobileOpen && (
                <div className="sidebar-overlay-admin" onClick={() => onToggleMobileMenu(false)}></div>
            )}

            <aside className={`admin-sidebar-premium ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                {/* ── Brand Header ── */}
                {/* ── Brand Header ── */}
                <div className="sidebar-header-admin">
                    <div
                        className="logo-box-premium"
                        onClick={() => navigate('/admin')}
                        style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
                    >
                        <div className="logo-symbol-orange">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'white' }}>biotech</span>
                        </div>
                        {(!isCollapsed || isMobileOpen) && (
                            <div className="logo-text-premium" style={{ fontSize: '1.2rem', fontWeight: 900 }}>
                                SMART <span>INSPECT</span>
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar Toggle Arrow (Chevron) ── */}
                    <button className="sidebar-collapse-btn-inner" onClick={onToggleCollapse} title={isCollapsed ? 'Expand' : 'Collapse'}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                            {isCollapsed ? 'arrow_forward' : 'arrow_back'}
                        </span>
                    </button>
                </div>

                {/* ── Navigation Items ── */}
                <nav className="sidebar-nav-admin">
                    {menuItems.map((item) => (
                        <div
                            key={item.key}
                            className={`nav-item-admin ${activePage === item.key ? 'active' : ''}`}
                            onClick={() => {
                                if (item.path) navigate(item.path);
                                onToggleMobileMenu(false);
                            }}
                            title={isCollapsed ? item.label : ''}
                        >
                            <div className="nav-icon-box">
                                <span className="material-symbols-outlined">{item.icon}</span>
                            </div>
                            {(!isCollapsed || isMobileOpen) && (
                                <div className="nav-text-admin">
                                    <span className="nav-label">{item.label}</span>
                                    {item.desc && <span className="nav-desc">{item.desc}</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* ── Footer: Profile + Logout ── */}
                <div className="sidebar-footer-admin">
                    <div
                        className={`nav-item-admin ${activePage === 'profile' ? 'active' : ''}`}
                        onClick={() => { navigate('/admin/profile'); onToggleMobileMenu(false); }}
                    >
                        <div className="nav-icon-box">
                            <span className="material-symbols-outlined">account_circle</span>
                        </div>
                        {(!isCollapsed || isMobileOpen) && <span className="nav-label">Mon Profil Admin</span>}
                    </div>

                    <button className="logout-btn-admin" onClick={handleLogout}>
                        <div className="nav-icon-box">
                            <span className="material-symbols-outlined">logout</span>
                        </div>
                        {(!isCollapsed || isMobileOpen) && <span className="nav-label">Quitter le panel</span>}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default AdminSidebar;
