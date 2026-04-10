import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserSidebar from './UserSidebar';
import UserNavbar from './UserNavbar';
import './UserLayout.css';
import './UserSidebar.css';

const UserLayout = ({ children, activePage }) => {
    const navigate = useNavigate();
    
    // Sidebar Collapse State (Desktop)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('userSidebarCollapsed');
        return saved !== null ? saved === 'true' : true;
    });

    // Mobile Menu State (Drawer)
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        if (isCollapsed) {
            document.body.classList.add('sidebar-collapsed');
        } else {
            document.body.classList.remove('sidebar-collapsed');
        }
        localStorage.setItem('userSidebarCollapsed', isCollapsed);
    }, [isCollapsed]);

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleToggleMobileMenu = (state) => {
        setIsMobileOpen(state !== undefined ? state : !isMobileOpen);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className={`user-layout-container ${isCollapsed ? 'sidebar-collapsed' : ''} font-display`}>
            {/* Sidebar Component */}
            <UserSidebar 
                activePage={activePage}
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onToggleCollapse={handleToggleCollapse}
                onToggleMobileMenu={handleToggleMobileMenu}
            />

            <div className="user-layout-main">
                {/* Fixed Top Navbar */}
                <UserNavbar 
                    onToggleMobileMenu={() => handleToggleMobileMenu(true)}
                    onLogout={handleLogout}
                />

                {/* Page Content */}
                <main className="user-layout-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
