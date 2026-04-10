import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import './DashboardPage.css';
import './ProfilePage.css';

const TUNISIAN_REGIONS = [
    'Ariana', 'Béja', 'Ben Arous', 'Bizerte', 'Gabès',
    'Gafsa', 'Jendouba', 'Kairouan', 'Kasserine', 'Kébili',
    'Kef', 'Mahdia', 'Manouba', 'Médenine', 'Monastir',
    'Nabeul', 'Sfax', 'Sidi Bouzid', 'Siliana', 'Sousse',
    'Tataouine', 'Tozeur', 'Tunis', 'Zaghouan'
];

const ProfilePage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [phoneLocal, setPhoneLocal] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [specificAddress, setSpecificAddress] = useState('');
    const [photo, setPhoto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    const userEmail = localStorage.getItem('userEmail')?.toLowerCase();

    useEffect(() => {
        if (!userEmail) { navigate('/login'); return; }

        const fetchUserDetails = async () => {
            try {
                console.log('Fetching profile for:', userEmail);
                const response = await fetch(`http://127.0.0.1:8081/api/personnes/by-email/${userEmail}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Profile data received:', data);
                    setUser(data);
                    
                    // Robust mapping for phone and address
                    const tel = data.telephone || '';
                    setPhoneLocal(tel.startsWith('+216') ? tel.slice(4).trim() : tel);
                    
                    const fullAddr = data.adresse || '';
                    if (fullAddr.includes(',')) {
                        const [reg, ...rest] = fullAddr.split(',');
                        setSelectedRegion(reg.trim());
                        setSpecificAddress(rest.join(',').trim());
                    } else if (TUNISIAN_REGIONS.includes(fullAddr)) {
                        setSelectedRegion(fullAddr);
                        setSpecificAddress('');
                    } else {
                        setSelectedRegion('');
                        setSpecificAddress(fullAddr);
                    }
                    setPhoto(data.photo || null);
                } else {
                    console.error('Profile fetch failed:', response.status);
                    setMessage({ text: 'Erreur: Profil non trouvé au serveur.', type: 'error' });
                }
            } catch (error) {
                console.error('Erreur réseau profil:', error);
                setMessage({ text: 'Erreur de connexion au serveur.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        if (userEmail) fetchUserDetails();
        else { navigate('/login'); setLoading(false); }
    }, [userEmail, navigate]);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 800 * 1024) {
                setMessage({ text: 'La taille de l\'image ne doit pas dépasser 800 Ko', type: 'error' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleDeletePhoto = async () => {
        setPhoto(null);
        setMessage({ text: '', type: '' });
        try {
            const response = await fetch(`http://127.0.0.1:8081/api/personnes/${userEmail}/remove-photo`, {
                method: 'PUT',
            });
            if (response.ok) {
                const updated = await response.json();
                setUser(updated);
                setMessage({ text: '✅ Photo supprimée avec succès !', type: 'success' });
            } else {
                setMessage({ text: '❌ Erreur lors de la suppression de la photo.', type: 'error' });
            }
        } catch {
            setMessage({ text: '❌ Erreur réseau.', type: 'error' });
        }
    };


    const handleSaveChanges = async () => {
        try {
            const fullPhone = phoneLocal.trim() ? `+216 ${phoneLocal.trim()}` : '';
            const combinedAddress = selectedRegion && specificAddress 
                ? `${selectedRegion}, ${specificAddress}` 
                : (selectedRegion || specificAddress || '');
            
            const updateData = { ...user, telephone: fullPhone, adresse: combinedAddress, photo: photo };
            const response = await fetch(`http://127.0.0.1:8081/api/personnes/update/${userEmail}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
            if (response.ok) {
                const updated = await response.json();
                setUser(updated);
                
                // Sync with Navbar
                localStorage.setItem('userPhoto', updated.photo || '');
                localStorage.setItem('userName', `${updated.prenom} ${updated.nom}`);
                window.dispatchEvent(new Event('profileUpdate'));

                setMessage({ text: '✅ Profil mis à jour avec succès !', type: 'success' });
            } else {
                setMessage({ text: '❌ Erreur lors de la mise à jour.', type: 'error' });
            }
        } catch {
            setMessage({ text: '❌ Erreur réseau. Vérifiez votre connexion.', type: 'error' });
        }
    };

    const handleCancel = () => {
        if (user) {
            const tel = user.telephone || '';
            setPhoneLocal(tel.startsWith('+216') ? tel.slice(4).trim() : tel);
            // Reset address components
            const fullAddr = user.adresse || '';
            if (fullAddr.includes(',')) {
                const [reg, ...rest] = fullAddr.split(',');
                setSelectedRegion(reg.trim());
                setSpecificAddress(rest.join(',').trim());
            } else if (TUNISIAN_REGIONS.includes(fullAddr)) {
                setSelectedRegion(fullAddr);
                setSpecificAddress('');
            } else {
                setSelectedRegion('');
                setSpecificAddress(fullAddr);
            }
            setPhoto(user.photo || null);
            setMessage({ text: '', type: '' });
        }
    };

    const getPhotoSrc = (p) => {
        if (!p) return null;
        return p.startsWith('data:') ? p : `data:image/jpeg;base64,${p}`;
    };

    if (loading) {
        return (
            <div className="dashboard-page font-display" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <p style={{ color: '#718096', fontSize: '1rem' }}>Chargement du profil...</p>
            </div>
        );
    }

    return (
        <UserLayout activePage="profile">
            <div className="page-intro" style={{ marginBottom: '2rem' }}>
                <div className="intro-text">
                    <h1 className="text-3xl font-black text-slate-900">Mon Profil</h1>
                    <p className="text-slate-500 mt-2">Gérez vos informations personnelles.</p>
                </div>
            </div>

            <main className="dashboard-container" style={{ maxWidth: '1100px', padding: 0 }}>
                <div className="profile-content-grid">
                    <div className="profile-col-left">
                        <div className="profile-card-dash">
                            <div className="profile-card-header">
                                <span className="material-symbols-outlined" style={{ color: '#ec5b13' }}>person</span>
                                <h2>Informations du Profil</h2>
                            </div>
                            <div className="profile-card-body">
                                <div className="avatar-upload-section">
                                    <div className="avatar-wrapper">
                                        {getPhotoSrc(photo) ? (
                                            <img src={getPhotoSrc(photo)} alt="Profil" className="large-avatar" />
                                        ) : (
                                            <div className="large-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', color: '#a0aec0' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '3rem' }}>person</span>
                                            </div>
                                        )}
                                        <div className="camera-badge">
                                            <span className="material-symbols-outlined">photo_camera</span>
                                        </div>
                                    </div>
                                    <div className="upload-info">
                                        <h3>Changer la photo</h3>
                                        <p>JPG, GIF ou PNG. Maximum 800 Ko</p>
                                        <div className="upload-actions">
                                            <label className="profile-btn-primary" style={{ cursor: 'pointer' }}>
                                                Importer
                                                <input type="file" accept=".jpg,.jpeg,.gif,.png" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                                            </label>
                                            <button className="profile-btn-secondary" onClick={handleDeletePhoto}>
                                                Supprimer
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row" style={{ marginTop: '1.5rem' }}>
                                    <div className="form-group flex-1">
                                        <label className="profile-label">NUMÉRO DE TÉLÉPHONE</label>
                                        <div className="phone-input-wrapper">
                                            <span className="phone-prefix">+216</span>
                                            <input
                                                type="tel"
                                                className="phone-local-input"
                                                value={phoneLocal}
                                                onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                                placeholder="XX XXX XXX"
                                                maxLength={8}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group flex-1">
                                        <label className="profile-label">RÉGION (TUNISIE)</label>
                                        <div className="select-wrapper">
                                            <span className="material-symbols-outlined select-icon">location_on</span>
                                            <select
                                                className="region-select"
                                                value={selectedRegion}
                                                onChange={(e) => setSelectedRegion(e.target.value)}
                                            >
                                                <option value="">-- Sélectionner une région --</option>
                                                {TUNISIAN_REGIONS.map((r) => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row" style={{ marginTop: '1rem' }}>
                                    <div className="form-group flex-1">
                                        <label className="profile-label">ADRESSE PRÉCISE</label>
                                        <div className="phone-input-wrapper">
                                            <span className="material-symbols-outlined phone-prefix" style={{ fontSize: '1.2rem' }}>map</span>
                                            <input
                                                type="text"
                                                className="phone-local-input"
                                                value={specificAddress}
                                                onChange={(e) => setSpecificAddress(e.target.value)}
                                                placeholder="Ex: Manzel chker km 2"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {message.text && (
                                    <div style={{
                                        marginTop: '1rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: '8px',
                                        backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                                        color: message.type === 'success' ? '#166534' : '#991b1b',
                                        fontWeight: '600',
                                        fontSize: '0.9rem'
                                    }}>
                                        {message.text}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                    <button className="profile-btn-primary" onClick={handleSaveChanges}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>save</span>
                                        Sauvegarder
                                    </button>
                                    <button className="profile-btn-secondary" onClick={handleCancel}>
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-col-right">
                        <div className="profile-card-dash">
                            <div className="profile-card-header">
                                <span className="material-symbols-outlined" style={{ color: '#a0aec0' }}>lock</span>
                                <h2>Détails du Compte</h2>
                            </div>
                            <div className="profile-card-body">
                                {[
                                    { label: 'NOM COMPLET', value: `${user?.nom || ''} ${user?.prenom || ''}` },
                                    { label: 'ADRESSE EMAIL', value: user?.email || '' },
                                ].map((item, i) => (
                                    <div key={i} style={{ marginBottom: '1.25rem' }}>
                                        <label className="profile-label">{item.label}</label>
                                        <div className="input-readonly">
                                            <span>{item.value}</span>
                                            <span className="material-symbols-outlined" style={{ color: '#d1d5db', fontSize: '1.1rem' }}>lock</span>
                                        </div>
                                    </div>
                                ))}

                                <div style={{ marginBottom: '1.25rem' }}>
                                    <label className="profile-label">STATUT DU COMPTE</label>
                                    <div className="input-readonly">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                                            <span>Actif</span>
                                        </div>
                                        <span className="material-symbols-outlined" style={{ color: '#d1d5db', fontSize: '1.1rem' }}>lock</span>
                                    </div>
                                </div>

                                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '1rem', display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#ea580c', flexShrink: 0 }}>info</span>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px', color: '#ea580c', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NOTE DE SÉCURITÉ</h4>
                                        <p style={{ margin: 0, color: '#c2410c', fontSize: '0.85rem', lineHeight: 1.5 }}>
                                            Pour modifier votre email ou votre nom d'utilisateur, veuillez contacter l'administrateur de votre organisation.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="dashboard-footer">
                <span>© 2024 SMART INSPECT. Tous droits réservés.</span>
                <div className="footer-links">
                    <a href="#">Conditions d'utilisation</a>
                    <a href="#">Politique de confidentialité</a>
                    <a href="#">Support</a>
                </div>
            </footer>
        </UserLayout>
    );
};

export default ProfilePage;
