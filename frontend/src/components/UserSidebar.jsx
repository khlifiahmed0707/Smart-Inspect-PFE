import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserSidebar.css';

const UserSidebar = ({ activePage, isCollapsed, isMobileOpen, onToggleCollapse, onToggleMobileMenu }) => {
    const navigate = useNavigate();

    const handleNavigation = (path) => {
        if (path) {
            onToggleMobileMenu(false); // Always close mobile menu on click
            navigate(path);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const menuItems = [
        { icon: "dashboard", label: "Tableau de Bord", path: "/dashboard", key: "dashboard" },
        { icon: "cloud_upload", label: "Nouvelle Inspection", desc: "Démarrer une analyse IA", path: "/inspection", key: "inspection" },
        { icon: "history", label: "Historique", desc: "Consulter vos rapports", path: "/history", key: "history" },
        { icon: "analytics", label: "Statistiques", desc: "Analyses & Rapports", path: "/statistics", key: "statistics" },
        { icon: "assignment_turned_in", label: "Mes Missions", desc: "Tâches assignées", path: "/missions", key: "missions" }
    ];

    const showText = isMobileOpen || !isCollapsed;

    return (
        <>
            <div 
                className={`mobile-sidebar-overlay ${isMobileOpen ? 'visible' : ''}`} 
                onClick={() => onToggleMobileMenu(false)}
            ></div>
            <aside className={`user-sidebar ${!isMobileOpen && isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-brand">
                    <div className="brand-logo-container">
                        <div className="brand-icon-box">
                            <span className="material-symbols-outlined text-xl">biotech</span>
                        </div>
                        {showText && (
                            <div className="brand-text-content">
                                <span className="brand-title-text font-black text-slate-800">Smart Inspect</span>
                                <span className="brand-subtitle font-bold text-slate-400">Espace Utilisateur</span>
                            </div>
                        )}
                    </div>
                    
                    {/* PC Toggle Button (Hidden on Mobile via CSS) */}
                    {!isMobileOpen && (
                        <button 
                            className="sidebar-toggle" 
                            onClick={onToggleCollapse}
                        >
                            <span className="material-symbols-outlined">
                                {isCollapsed ? 'menu_open' : 'menu'}
                            </span>
                        </button>
                    )}

                    {/* Mobile Close Button (X) - Always on the right if shown */}
                    <button className="mobile-close-btn" onClick={() => onToggleMobileMenu(false)}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => (
                        <div
                            key={item.key}
                            className={`nav-item ${activePage === item.key ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.path)}
                            title={isCollapsed && !isMobileOpen ? item.label : ''}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            {showText && (
                                <div className="nav-item-content">
                                    <span className="nav-item-label">{item.label}</span>
                                    {item.desc && <span className="nav-item-desc">{item.desc}</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div 
                        className={`nav-item ${activePage === 'profile' ? 'active' : ''}`} 
                        onClick={() => handleNavigation('/profile')}
                        style={{ marginBottom: '0.5rem' }}
                        title={isCollapsed && !isMobileOpen ? "Gérer le Profil" : ""}
                    >
                        <span className="material-symbols-outlined">manage_accounts</span>
                        {showText && <span>Gérer le Profil</span>}
                    </div>
                    <div className="nav-item logout-item" onClick={handleLogout} title={isCollapsed && !isMobileOpen ? "Déconnexion" : ""}>
                        <span className="material-symbols-outlined">logout</span>
                        {showText && <span>Déconnexion</span>}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default UserSidebar;
