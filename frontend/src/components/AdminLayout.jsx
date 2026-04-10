import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminNavbar from './AdminNavbar';
import './AdminLayout.css';
import './AdminSidebar.css';

const AdminLayout = ({ children, activePage }) => {
    const navigate = useNavigate();
    
    // Sidebar Collapse State (Desktop)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem('adminSidebarCollapsed');
        return saved !== null ? saved === 'true' : false;
    });

    // Mobile Menu State (Drawer)
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const adminName = localStorage.getItem('userName') || 'Administrateur';

    useEffect(() => {
        if (isCollapsed) {
            document.body.classList.add('admin-sidebar-collapsed');
        } else {
            document.body.classList.remove('admin-sidebar-collapsed');
        }
        localStorage.setItem('adminSidebarCollapsed', isCollapsed);
    }, [isCollapsed]);

    const handleToggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleToggleMobileMenu = (state) => {
        setIsMobileOpen(state !== undefined ? state : !isMobileOpen);
    };

    return (
        <div className={`admin-layout-container ${isCollapsed ? 'sidebar-collapsed' : ''} font-display`}>
            {/* Sidebar Component */}
            <AdminSidebar 
                activePage={activePage}
                isCollapsed={isCollapsed}
                isMobileOpen={isMobileOpen}
                onToggleCollapse={handleToggleCollapse}
                onToggleMobileMenu={handleToggleMobileMenu}
            />

            <div className="admin-layout-main">
                {/* Fixed Top Navbar */}
                <AdminNavbar 
                    onToggleMobileMenu={() => handleToggleMobileMenu(true)}
                    adminName={adminName}
                />

                {/* Page Content */}
                <main className="admin-layout-content">
                    <div className="admin-content-inner">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
