import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserLayout.css';

const UserNavbar = ({ onToggleMobileMenu, onLogout }) => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Utilisateur';
    const userEmail = localStorage.getItem('userEmail') || '';
    const [userPhoto, setUserPhoto] = useState(localStorage.getItem('userPhoto') || '');

    const syncNavbarPhoto = () => {
        const storedPhoto = localStorage.getItem('userPhoto');
        if (storedPhoto) {
            setUserPhoto(storedPhoto.startsWith('data:') ? storedPhoto : `data:image/jpeg;base64,${storedPhoto}`);
        } else {
            setUserPhoto('');
        }
    };

    useEffect(() => {
        // Initial sync
        syncNavbarPhoto();

        // Listen for internal profile updates
        window.addEventListener('profileUpdate', syncNavbarPhoto);
        
        // Listen for updates from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === 'userPhoto') syncNavbarPhoto();
        });

        // Fallback: if userEmail exists but photo is empty in localStorage, try one fetch
        if (userEmail && !localStorage.getItem('userPhoto')) {
            const fetchOnce = async () => {
                try {
                    const response = await fetch(`http://127.0.0.1:8081/api/personnes/by-email/${userEmail}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.photo) {
                            localStorage.setItem('userPhoto', data.photo);
                            syncNavbarPhoto();
                        }
                    }
                } catch (e) { console.error(e); }
            };
            fetchOnce();
        }

        return () => {
            window.removeEventListener('profileUpdate', syncNavbarPhoto);
            window.removeEventListener('storage', syncNavbarPhoto);
        };
    }, [userEmail]);

    return (
        <header className="user-navbar">
            <div className="navbar-left">
                {/* Mobile Hamburger Menu Button */}
                <button className="mobile-menu-btn" onClick={onToggleMobileMenu}>
                    <span className="material-symbols-outlined">menu</span>
                </button>
                
                {/* Mobile Logo (Visible only on mobile) */}
                <div className="header-mobile-logo">
                    <div className="brand-icon-box">
                        <span className="material-symbols-outlined text-xl">biotech</span>
                    </div>
                    <div className="brand-text">
                        <span className="brand-name">Smart Inspect</span>
                        <span className="brand-sub">Espace Utilisateur</span>
                    </div>
                </div>
            </div>

            <div className="navbar-right">
                <div className="user-profile-header" onClick={() => navigate('/profile')}>
                    <div className="user-info-text lg-only">
                        <span className="user-name">{userName}</span>
                        <span className="user-role">Inspecteur</span>
                    </div>
                    <div className="user-avatar-small">
                        {userPhoto ? (
                            <img src={userPhoto} alt="Profile" />
                        ) : (
                            <span className="material-symbols-outlined">person</span>
                        )}
                    </div>
                </div>

                <button className="btn-logout-navbar" onClick={onLogout}>
                    <span className="material-symbols-outlined">logout</span>
                    <span className="lg-only">Déconnexion</span>
                </button>
            </div>
        </header>
    );
};

export default UserNavbar;
