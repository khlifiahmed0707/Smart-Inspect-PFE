import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

const AdminNavbar = ({ onToggleMobileMenu, adminName: propAdminName }) => {
    const navigate = useNavigate();
    
    // Manage local UI state for instant updates
    const [userPhoto, setUserPhoto] = useState(localStorage.getItem('userPhoto') || '');
    const [displayName, setDisplayName] = useState(localStorage.getItem('userName') || propAdminName || 'Administrateur');

    // Sync function
    const syncProfileData = () => {
        const storedPhoto = localStorage.getItem('userPhoto');
        const storedName = localStorage.getItem('userName');
        
        if (storedPhoto) {
            setUserPhoto(storedPhoto.startsWith('data:') ? storedPhoto : `data:image/jpeg;base64,${storedPhoto}`);
        } else {
            setUserPhoto('');
        }
        
        if (storedName) {
            setDisplayName(storedName);
        }
    };

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'userPhoto' || e.key === 'userName') {
                syncProfileData();
            }
        };

        // Initial sync
        syncProfileData();

        // Listen for internal profile updates
        window.addEventListener('profileUpdate', syncProfileData);
        
        // Listen for updates from other tabs
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('profileUpdate', syncProfileData);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const initials = displayName ? displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'AD';

    return (
        <header className="admin-navbar-fixed">
            <div className="navbar-left">
                {/* Mobile-only burger */}
                <button
                    className="mobile-burger-btn"
                    onClick={onToggleMobileMenu}
                    title="Menu"
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
            </div>

            <div className="navbar-right">
                <NotificationDropdown />

                {/* Profile pill — Premium Orange Style */}
                <div className="profile-pill-premium" onClick={() => navigate('/admin/profile')}>
                    <div className="profile-avatar-white">
                        {userPhoto ? (
                            <img src={userPhoto} alt="Admin" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            initials
                        )}
                    </div>
                    <div className="profile-info-premium">
                        <span className="profile-name-premium">{displayName}</span>
                        <span className="profile-role-premium">Administrateur</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminNavbar;
