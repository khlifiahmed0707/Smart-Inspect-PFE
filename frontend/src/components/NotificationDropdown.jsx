import React, { useState, useEffect, useRef, useCallback } from 'react';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [activeToast, setActiveToast] = useState(null);
    const [isClearing, setIsClearing] = useState(false);

    const dropdownRef = useRef(null);
    const prevIdsRef = useRef(new Set());        // Track seen notification IDs
    const isInitialLoadRef = useRef(true);
    const toastTimerRef = useRef(null);
    const userEmail = (localStorage.getItem('userEmail') || '').toLowerCase().trim();

    // ── Fetch & Diff ──
    const fetchNotifications = useCallback(async () => {
        if (!userEmail) return;
        try {
            const res = await fetch(`/api/notifications?email=${encodeURIComponent(userEmail)}`);
            if (!res.ok) return;
            const data = await res.json();

            // Detect brand-new notifications (not seen before)
            const incoming = data.filter(n => !prevIdsRef.current.has(n.id));
            
            // Only toast if it's not the initial fetch
            if (incoming.length > 0 && isInitialLoadRef.current === false) {
                const latest = incoming.find(n => !n.read);
                if (latest) {
                    triggerToast(latest);
                    if (latest.type === 'DANGER') playPing();
                }
            }
            isInitialLoadRef.current = false;

            // Update seen set
            data.forEach(n => prevIdsRef.current.add(n.id));

            setNotifications(data);
            setUnreadCount(data.filter(n => !n.read).length);
        } catch {
            // silent — backend may be restarting
        }
    }, [userEmail]);

    // Poll every 3 seconds
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 3000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const triggerToast = (notif) => {
        setActiveToast(notif);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setActiveToast(null), 7000);
    };

    const playPing = () => {
        try {
            const a = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            a.volume = 0.4;
            a.play().catch(() => {});
        } catch {}
    };

    const markAsRead = async (id) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    const clearAll = async () => {
        setIsClearing(true);
        try {
            const res = await fetch(
                `/api/notifications/clear?email=${encodeURIComponent(userEmail)}`,
                { method: 'DELETE' }
            );
            const data = await res.json();
            if (res.ok && data.success) {
                setNotifications([]);
                setUnreadCount(0);
                prevIdsRef.current.clear(); // Reset seen IDs
                setIsOpen(false);
                setActiveToast(null);
            } else {
                alert('Erreur : ' + (data.error || 'Suppression échouée.'));
            }
        } catch {
            alert('Impossible de contacter le serveur.');
        } finally {
            setIsClearing(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            const diff = Math.floor((Date.now() - d) / 1000);
            if (diff < 60) return "à l'instant";
            if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
            if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
            return d.toLocaleDateString('fr-FR');
        } catch { return ''; }
    };

    const getIcon = (type) => {
        if (type === 'DANGER') return 'error';
        if (type === 'WARNING') return 'warning';
        return 'info';
    };

    const displayCount = unreadCount > 99 ? '99+' : unreadCount;

    return (
        <div className="notification-wrapper" ref={dropdownRef}>

            {/* ── Bell Button ── */}
            <button
                className="notif-btn-navbar"
                onClick={() => { setIsOpen(!isOpen); setActiveToast(null); }}
                title="Notifications"
            >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && <span className="notif-badge">{displayCount}</span>}
            </button>

            {/* ── Floating Toast (appears only when dropdown is closed) ── */}
            {activeToast && !isOpen && (
                <div
                    className={`root-notification-toast ${activeToast.type?.toLowerCase()}`}
                    onClick={() => { setIsOpen(true); setActiveToast(null); }}
                >
                    <div className="toast-icon">
                        <span className="material-symbols-outlined">{getIcon(activeToast.type)}</span>
                    </div>
                    <div className="toast-body">
                        <p className="toast-msg">{activeToast.message}</p>
                        <span className="toast-sub">Cliquez pour voir les détails</span>
                    </div>
                    <button className="toast-close" onClick={(e) => { e.stopPropagation(); setActiveToast(null); }}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}

            {/* ── Dropdown Panel ── */}
            {isOpen && (
                <>
                    <div className="notif-dropdown-overlay" onClick={() => setIsOpen(false)} />
                    <div className="notif-dropdown-premium">
                        {/* Header */}
                        <div className="notif-header">
                            <div className="notif-title-group">
                                <h3>Notifications</h3>
                                <span className="notif-count-badge">{unreadCount} non lues</span>
                            </div>
                            {notifications.length > 0 && (
                                <button
                                    className="clear-all-btn"
                                    onClick={clearAll}
                                    disabled={isClearing}
                                    title="Tout supprimer définitivement"
                                >
                                    {isClearing ? '...' : ' Tout supprimer'}
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="notif-list">
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={[
                                            'notif-item',
                                            n.read ? 'read' : 'unread',
                                            n.type?.toLowerCase(),
                                            n.type === 'DANGER' && !n.read ? 'pulse-danger' : ''
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => !n.read && markAsRead(n.id)}
                                    >
                                        <div className="notif-icon-box">
                                            <span className="material-symbols-outlined">{getIcon(n.type)}</span>
                                        </div>
                                        <div className="notif-content">
                                            <p className="notif-message">{n.message}</p>
                                            <span className="notif-time">{formatTime(n.createdAt)}</span>
                                            {n.relatedImage && (
                                                <button
                                                    className="view-anomaly-btn"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedImage(n.relatedImage); }}
                                                >
                                                    <span className="material-symbols-outlined">visibility</span>
                                                    Voir l'anomalie
                                                </button>
                                            )}
                                        </div>
                                        {!n.read && <div className="unread-indicator" />}
                                    </div>
                                ))
                            ) : (
                                <div className="notif-empty">
                                    <span className="material-symbols-outlined">notifications_off</span>
                                    <p>Aucune notification</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* ── Image Preview Modal ── */}
            {selectedImage && (
                <div className="notif-image-modal" onClick={() => setSelectedImage(null)}>
                    <div className="modal-close-btn">
                        <span className="material-symbols-outlined">close</span>
                    </div>
                    <img
                        src={selectedImage.startsWith('data:') ? selectedImage : `data:image/jpeg;base64,${selectedImage}`}
                        alt="Anomalie détectée par l'IA"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="modal-caption">Preuve visuelle de l'anomalie détectée par l'IA</div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
