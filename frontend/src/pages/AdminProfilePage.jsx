import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import './AdminProfilePage.css';

const AdminProfilePage = () => {
    const navigate = useNavigate();
    
    // Recovery of session identifiers
    const initialEmail = localStorage.getItem('userEmail') || "ahmedkhlifi0707@gmail.com";
    const adminName = localStorage.getItem('userName') || 'Administrateur';

    const isSuperAdmin = localStorage.getItem('userRole') === 'SUPER_ADMIN';

    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Admin management state (Super Admin only)
    const [normalAdmins, setNormalAdmins] = useState([]);
    const [newAdmin, setNewAdmin] = useState({ nom: '', prenom: '', email: '', password: '' });
    const [adminCreateStatus, setAdminCreateStatus] = useState(null); // 'loading'|'success'|'error'
    const [adminCreateMsg, setAdminCreateMsg] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // --- DELETE MODAL STATES ---
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [adminToDestroy, setAdminToDestroy] = useState(null);
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    
    const [adminData, setAdminData] = useState({
        nom: '',
        prenom: '',
        email: initialEmail,
        password: '',
        confirmPassword: '',
        telephone: '',
        adresse: '',
        photo: '',
        role: 'ADMIN'
    });

    const [updateStatus, setUpdateStatus] = useState(null); // 'success', 'error', 'loading'
    const [toastMessage, setToastMessage] = useState('');

    // --- NEW VERIFICATION STATES ---
    const [isVerificationMode, setIsVerificationMode] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationError, setVerificationError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    useEffect(() => {
        fetchAdminProfile();
        if (isSuperAdmin) fetchNormalAdmins();
    }, []);

    const fetchNormalAdmins = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8081/api/admin-normal/all');
            if (res.ok) setNormalAdmins(await res.json());
        } catch (e) { console.error('Failed to fetch normal admins', e); }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setAdminCreateStatus('loading');
        setAdminCreateMsg('');
        try {
            const res = await fetch('http://127.0.0.1:8081/api/admin-normal/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAdmin)
            });
            const data = await res.json();
            if (data.success) {
                setAdminCreateStatus('success');
                setAdminCreateMsg(data.message);
                setNewAdmin({ nom: '', prenom: '', email: '', password: '' });
                fetchNormalAdmins();
            } else {
                setAdminCreateStatus('error');
                setAdminCreateMsg(data.message || 'Erreur lors de la creation.');
            }
        } catch (e) {
            setAdminCreateStatus('error');
            setAdminCreateMsg('Erreur reseau.');
        }
    };

    const handleDeleteAdmin = (admin) => {
        setAdminToDestroy(admin);
        setDeleteConfirmInput('');
        setShowDeleteModal(true);
    };

    const handleConfirmDestroy = async () => {
        if (!adminToDestroy || deleteConfirmInput !== adminToDestroy.email) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`http://127.0.0.1:8081/api/admin-normal/${adminToDestroy.id}`, { method: 'DELETE' });
            if (res.ok) {
                setToastMessage(`L'accès de ${adminToDestroy.prenom} a été révoqué avec succès.`);
                setUpdateStatus('success');
                setShowDeleteModal(false);
                fetchNormalAdmins();
            }
        } catch (e) {
            console.error('Erreur lors de la suppression', e);
            setToastMessage('Échec de la révocation.');
            setUpdateStatus('error');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const res = await fetch(`http://127.0.0.1:8081/api/admin-normal/${id}/status`, { method: 'PATCH' });
            if (res.ok) {
                const data = await res.json();
                setToastMessage(data.message);
                setUpdateStatus('success');
                fetchNormalAdmins();
            }
        } catch (e) {
            console.error('Erreur lors du changement de statut', e);
            setToastMessage('Erreur lors du changement de statut.');
            setUpdateStatus('error');
        }
    };

    const filteredNormalAdmins = normalAdmins.filter(admin => {
        const query = searchTerm.toLowerCase();
        return (admin.nom?.toLowerCase().includes(query) || 
                admin.prenom?.toLowerCase().includes(query) || 
                admin.email?.toLowerCase().includes(query));
    });

    const fetchAdminProfile = async () => {
        try {
            const apiBase = isSuperAdmin ? 'http://127.0.0.1:8081/api/admin/me' : `http://127.0.0.1:8081/api/admin-normal/me?email=${initialEmail}`;
            const response = await fetch(apiBase);
            if (response.ok) {
                const data = await response.json();
                setAdminData({
                    ...data,
                    confirmPassword: data.password || ''
                });
                
                // Ensure localStorage and session match
                localStorage.setItem('userPhoto', data.photo || '');
                localStorage.setItem('userName', `${data.prenom} ${data.nom}`);
            }
        } catch (error) {
            console.error("Erreur lors du chargement du profil:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAdminData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setToastMessage("L'image est trop lourde (max 2Mo)");
            setUpdateStatus('error');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setAdminData(prev => ({ ...prev, photo: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleRemovePhoto = () => {
        setAdminData(prev => ({ ...prev, photo: '' }));
    };

    const handleSaveProfile = async (e) => {
        if (e) e.preventDefault();
        setUpdateStatus('loading');
        setToastMessage('');

        if (adminData.password && adminData.password !== adminData.confirmPassword) {
            setUpdateStatus('error');
            setToastMessage('Les protocoles de sécurité ne correspondent pas (MDP).');
            return;
        }

        // --- SECURITY WORKFLOW : EMAIL CHANGE DETECTION ---
        const normalizedInitial = initialEmail.toLowerCase().trim();
        const normalizedNew = adminData.email.toLowerCase().trim();

        if (normalizedNew !== normalizedInitial && !isVerificationMode) {
            // Trigger 2FA before saving
            await initiateEmailVerification(normalizedNew);
            return;
        }

        // Standard update if email hasn't changed OR if we are already verified
        await executeFinalUpdate();
    };

    const initiateEmailVerification = async (newEmail) => {
        try {
            const response = await fetch('http://127.0.0.1:8081/api/auth/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: newEmail, 
                    prenom: adminData.prenom, 
                    nom: adminData.nom 
                })
            });

            if (response.ok) {
                setIsVerificationMode(true);
                setUpdateStatus(null);
                setVerificationError('');
                setResendCooldown(60);
            } else {
                const error = await response.json();
                setUpdateStatus('error');
                setToastMessage(error.message || 'Échec de l\'envoi du code de vérification.');
            }
        } catch (error) {
            setUpdateStatus('error');
            setToastMessage('Erreur de connexion lors de l\'envoi du code.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otpCode.length !== 6) {
            setVerificationError('Le code doit contenir 6 chiffres.');
            return;
        }

        setIsVerifying(true);
        setVerificationError('');

        try {
            const response = await fetch('http://127.0.0.1:8081/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    email: adminData.email.trim(), 
                    code: otpCode 
                })
            });

            if (response.ok) {
                // Verification successful -> Proceed to final update
                await executeFinalUpdate();
                setIsVerificationMode(false);
            } else {
                setVerificationError('Code incorrect ou expiré. Veuillez réessayer.');
            }
        } catch (error) {
            setVerificationError('Erreur de communication avec le serveur.');
        } finally {
            setIsVerifying(false);
        }
    };

    const executeFinalUpdate = async () => {
        setUpdateStatus('loading');
        try {
            const apiBase = isSuperAdmin ? 'http://127.0.0.1:8081/api/admin/update' : 'http://127.0.0.1:8081/api/admin-normal/update';
            const response = await fetch(apiBase, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...adminData,
                    currentEmail: initialEmail, 
                    email: adminData.email.trim()
                })
            });

            if (response.ok) {
                const updated = await response.json();
                localStorage.setItem('userEmail', updated.email);
                localStorage.setItem('userName', `${updated.prenom} ${updated.nom}`);
                localStorage.setItem('userPhoto', updated.photo || '');
                
                // NOTIFY OTHER COMPONENTS (LIKE NAVBAR)
                window.dispatchEvent(new Event('profileUpdate'));

                setAdminData({ ...updated, confirmPassword: updated.password });
                setUpdateStatus('success');
                setToastMessage('Profil synchronisé avec succès !');
                setIsVerificationMode(false);
            } else {
                const errorText = await response.text();
                setUpdateStatus('error');
                setToastMessage(errorText || 'Échec de la synchronisation finale.');
            }
        } catch (error) {
            setUpdateStatus('error');
            setToastMessage('Erreur fatale lors de la synchronisation.');
        }
    };

    const handleResendCode = () => {
        if (resendCooldown > 0) return;
        initiateEmailVerification(adminData.email.trim());
    };

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    return (
        <AdminLayout activePage="profile">
            <div className="admin-content-premium">
                <div className="page-intro-admin flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Configurez votre Cockpit</h2>
                        <p className="text-slate-500 font-medium">Gestion de l'identité administrative et des protocoles de sécurité.</p>
                    </div>
                </div>

                {toastMessage && (
                    <div className={`mt-8 px-6 py-5 rounded-[24px] border flex items-center justify-between shadow-lg animate-slideUp ${
                        updateStatus === 'success' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-red-50 border-red-100 text-red-600'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${updateStatus === 'success' ? 'bg-orange-500' : 'bg-red-100'}`}>
                                <span className="material-symbols-outlined text-white font-black">
                                    {updateStatus === 'success' ? 'lock_reset' : 'warning'}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black opacity-50 uppercase tracking-[0.2em] mb-0.5">Notification de sécurité</p>
                                <p className="text-sm font-bold tracking-tight">{toastMessage}</p>
                            </div>
                        </div>
                        <button onClick={() => setToastMessage('')} className="opacity-40 hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-10">
                    {/* Main Settings Card */}
                    <div className="lg:col-span-2">
                        {isVerificationMode ? (
                            /* VERIFICATION CARD */
                            <div className="bg-white rounded-[40px] shadow-2xl border-2 border-orange-100 overflow-hidden animate-slideUp">
                                <div className="p-10 bg-orange-50/30 border-b border-orange-100 flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-orange-600">
                                        <span className="material-symbols-outlined text-4xl font-black">domain_verification</span>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 text-2xl tracking-tight">Vérification de sécurité</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Validation de la nouvelle adresse email</p>
                                    </div>
                                </div>

                                <div className="p-12 text-center">
                                    <div className="max-w-md mx-auto">
                                        <p className="text-slate-500 font-medium leading-relaxed mb-10">
                                            Pour confirmer le changement vers <strong className="text-slate-900">{adminData.email}</strong>, veuillez saisir le code à 6 chiffres envoyé à cette adresse.
                                        </p>

                                        <div className="relative mb-8">
                                            <input 
                                                type="text" 
                                                maxLength="6"
                                                value={otpCode}
                                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                                                className={`w-full h-20 bg-slate-50 border-2 rounded-[24px] text-center text-4xl font-black tracking-[1em] focus:bg-white transition-all outline-none ${
                                                    verificationError ? 'border-red-200 text-red-600' : 'border-slate-100 focus:border-orange-500 text-slate-900'
                                                }`}
                                                placeholder="000000"
                                            />
                                            {verificationError && (
                                                <p className="text-red-500 text-xs font-bold mt-3 animate-shake">{verificationError}</p>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <button 
                                                onClick={handleVerifyOTP}
                                                disabled={isVerifying || otpCode.length < 6}
                                                className="btn-mgt-primary-orange w-full h-16 text-lg font-black shadow-lg shadow-orange-500/20 disabled:opacity-50"
                                            >
                                                {isVerifying ? (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        <span>Vérification...</span>
                                                    </div>
                                                ) : 'VALIDER LE CODE'}
                                            </button>

                                            <div className="flex items-center justify-center gap-6 mt-4">
                                                <button 
                                                    onClick={handleResendCode}
                                                    disabled={resendCooldown > 0}
                                                    className={`text-xs font-black uppercase tracking-widest transition-colors ${
                                                        resendCooldown > 0 ? 'text-slate-300' : 'text-slate-400 hover:text-orange-600'
                                                    }`}
                                                >
                                                    {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
                                                </button>
                                                <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                                <button 
                                                    onClick={() => setIsVerificationMode(false)}
                                                    className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* MAIN PROFILE FORM */
                            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-orange-500">
                                            <span className="material-symbols-outlined font-black">settings_accessibility</span>
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-lg">Identité Professionnelle</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informations de base & Sécurité</p>
                                        </div>
                                    </div>
                                </div>

                                <form className="p-10" onSubmit={handleSaveProfile}>
                                    <div className="form-grid-premium">
                                        <div className="form-group-admin">
                                            <label>Votre Prénom</label>
                                            <input type="text" name="prenom" value={adminData.prenom} onChange={handleInputChange} 
                                                required placeholder="ex: Ahmed" readOnly={!isSuperAdmin} className={!isSuperAdmin ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''} />
                                        </div>
                                        <div className="form-group-admin">
                                            <label>Votre Nom de famille</label>
                                            <input type="text" name="nom" value={adminData.nom} onChange={handleInputChange} 
                                                required placeholder="ex: Khlifi" readOnly={!isSuperAdmin} className={!isSuperAdmin ? 'bg-slate-50 opacity-70 cursor-not-allowed' : ''} />
                                        </div>
                                        <div className="form-group-admin span-2">
                                            <label>Coordonnées E-mail (Identifiant)</label>
                                            <input type="email" name="email" value={adminData.email} onChange={handleInputChange} required placeholder="admin@smart-inspect.com" />
                                        </div>
                                        {!isSuperAdmin && (
                                            <>
                                                <div className="form-group-admin">
                                                    <label>Numéro de Téléphone</label>
                                                    <input type="tel" name="telephone" value={adminData.telephone || ''} onChange={handleInputChange} placeholder="+216 -- --- ---" />
                                                </div>
                                                <div className="form-group-admin">
                                                    <label>Adresse Résidentielle</label>
                                                    <input type="text" name="adresse" value={adminData.adresse || ''} onChange={handleInputChange} placeholder="Ville, Tunisie" />
                                                </div>
                                            </>
                                        )}
                                        <div className="form-group-admin">
                                            <label>Protocole de Sécurité (MDP)</label>
                                            <input type="password" name="password" value={adminData.password} onChange={handleInputChange} placeholder="••••••••" />
                                        </div>
                                        <div className="form-group-admin">
                                            <label>Validation du protocole</label>
                                            <input type="password" name="confirmPassword" value={adminData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-12 pt-8 border-t border-slate-50">
                                        <button type="submit" className="btn-mgt-primary-orange px-12 h-[56px] text-base" disabled={updateStatus === 'loading'}>
                                            {updateStatus === 'loading' ? 'Mise à jour...' : 'SYNCHRONISER LES ACCÈS'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Branding / Summary Card */}
                    <div className="space-y-8">
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
                            
                            <div className="relative w-32 h-32 mx-auto mb-8">
                                <div className="w-full h-full bg-slate-50 text-slate-200 rounded-full flex items-center justify-center text-5xl font-black border-4 border-white shadow-xl overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                    {adminData.photo ? (
                                        <img src={adminData.photo.startsWith('data:') ? adminData.photo : `data:image/jpeg;base64,${adminData.photo}`} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        (adminData.prenom?.[0] || 'A') + (adminData.nom?.[0] || 'D')
                                    )}
                                </div>
                                
                                {/* Photo Actions Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 rounded-full">
                                    <div className="flex gap-2">
                                        <label className="w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-orange-500 hover:text-white transition-all shadow-lg">
                                            <span className="material-symbols-outlined text-xl">photo_camera</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                        </label>
                                        {adminData.photo && (
                                            <button onClick={handleRemovePhoto} className="w-10 h-10 bg-white text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-lg">
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 border-4 border-white rounded-full flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-white text-xs font-black">check</span>
                                </div>
                            </div>

                            <h3 className="font-black text-2xl text-slate-900 leading-tight">{adminData.prenom} {adminData.nom}</h3>
                            <div className="mt-3 flex items-center justify-center gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
                                <span className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em]">
                                    {isSuperAdmin ? 'Super Administrateur' : 'Administrateur'}
                                </span>
                            </div>

                            <div className="mt-10 pt-10 border-t border-slate-50 space-y-5">
                                <div className="flex items-center gap-4 text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-orange-50/50 group-hover:border-orange-100 transition-all">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                                        <span className="material-symbols-outlined text-xl">shield_person</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type d'Accès</p>
                                        <p className="text-xs font-black text-slate-700">
                                            {isSuperAdmin ? 'Privilèges Racine (Root)' : 'Privilèges Administrateur'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sécurité Cockpit */}
                        <div className="bg-slate-900 p-10 rounded-[40px] text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 right-0 p-10 opacity-10">
                                <span className="material-symbols-outlined text-9xl">lock_open</span>
                            </div>
                            
                            <h4 className="text-xl font-black mb-3 relative z-10">Sécurité Cockpit</h4>
                            <p className="text-slate-400 text-xs mb-8 leading-relaxed relative z-10 font-medium">Votre accès est protégé par un encodage SHA-256 et une session persistante sécurisée.</p>
                            <button className="relative z-10 w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                                Journal des Connexions
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===== ADMIN MANAGEMENT SECTION — START — SUPER ADMIN ONLY ===== */}
                {isSuperAdmin && (
                    <div className="mt-20 border-t border-slate-100 pt-20">
                        <div className="max-w-4xl mx-auto mb-16 text-center">
                            <h3 className="text-3xl font-black text-slate-900 mb-4">Gestion des Administrateurs</h3>
                            <p className="text-slate-500 font-medium italic">Seul le Super Admin (Ahmed Khlifi) a le privilège de créer, modifier ou révoquer les accès administratifs de SMART INSPECT.</p>
                        </div>

                        {/* Creation Card — Centered & Elegant */}
                        <div className="max-w-2xl mx-auto bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-24">
                            <div className="p-8 border-b border-slate-50 bg-orange-50/30 flex items-center justify-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-orange-600">
                                    <span className="material-symbols-outlined font-black">person_add</span>
                                </div>
                                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight text-center">Nouvel Accès Administratif</h3>
                            </div>

                            <form className="p-12" onSubmit={handleCreateAdmin}>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="form-group-admin">
                                            <label>Prénom de l'Admin</label>
                                            <input type="text" placeholder="ex: Jesser" value={newAdmin.prenom}
                                                onChange={e => setNewAdmin(p => ({...p, prenom: e.target.value}))} required />
                                        </div>
                                        <div className="form-group-admin">
                                            <label>Nom de Famille</label>
                                            <input type="text" placeholder="ex: Abes" value={newAdmin.nom}
                                                onChange={e => setNewAdmin(p => ({...p, nom: e.target.value}))} required />
                                        </div>
                                    </div>
                                    <div className="form-group-admin">
                                        <label>Email Professionnel (Identifiant)</label>
                                        <input type="email" placeholder="admin@smart-inspect.com" value={newAdmin.email}
                                            onChange={e => setNewAdmin(p => ({...p, email: e.target.value}))} required />
                                    </div>
                                    <div className="form-group-admin">
                                        <label>Clé de Sécurité Provisoire</label>
                                        <input type="text" placeholder="Générez un mot de passe initial fort" value={newAdmin.password}
                                            onChange={e => setNewAdmin(p => ({...p, password: e.target.value}))} required />
                                    </div>
                                </div>

                                {adminCreateMsg && (
                                    <div className={`mt-8 p-4 rounded-2xl text-sm font-bold animate-slideUp text-center ${
                                        adminCreateStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                    }`}>
                                        <span className="material-symbols-outlined text-sm align-middle mr-2">
                                            {adminCreateStatus === 'success' ? 'check_circle' : 'error'}
                                        </span>
                                        {adminCreateMsg}
                                    </div>
                                )}

                                <button type="submit" disabled={adminCreateStatus === 'loading'}
                                    className="btn-mgt-primary-orange w-full h-[64px] mt-10 text-base font-black shadow-xl shadow-orange-500/30 disabled:opacity-50 transition-all hover:scale-[1.02]">
                                    {adminCreateStatus === 'loading' ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>INITIALISATION...</span>
                                        </div>
                                    ) : 'DÉPLOYER L\'ADMINISTRATEUR'}
                                </button>
                            </form>
                        </div>

                        {/* List & Search Section */}
                        <div className="max-w-6xl mx-auto">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">
                                        {filteredNormalAdmins.length}
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Liste des Gardiens du Cockpit</h4>
                                </div>
                                
                                <div className="relative w-full md:w-96">
                                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                                    <input 
                                        type="text" 
                                        placeholder="Filtrer par nom, prénom ou email..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full h-14 pl-14 pr-6 bg-white border border-slate-100 rounded-2xl shadow-sm focus:border-orange-500 focus:ring-4 focus:ring-orange-50 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                                    />
                                </div>
                            </div>

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredNormalAdmins.map(admin => (
                                    <div key={admin.id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:border-orange-100 transition-all duration-300 group relative">
                                        {/* Status Badge */}
                                        <div className="absolute top-6 right-6">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                admin.enabled ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                                            }`}>
                                                {admin.enabled ? 'ACTIF' : 'DÉSACTIVÉ'}
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-center text-center">
                                            <div className="w-24 h-24 bg-slate-50 rounded-3xl mb-6 shadow-inner overflow-hidden flex items-center justify-center text-3xl font-black text-slate-300 border-2 border-white group-hover:scale-105 transition-transform duration-500">
                                                {admin.photo ? (
                                                    <img src={admin.photo.startsWith('data:') ? admin.photo : `data:image/jpeg;base64,${admin.photo}`} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    admin.prenom?.[0] + admin.nom?.[0]
                                                )}
                                            </div>

                                            <h5 className="text-lg font-black text-slate-900 leading-tight">{admin.prenom} {admin.nom}</h5>
                                            <p className="text-xs font-bold text-orange-500 mt-1 uppercase tracking-widest">Admin de Cockpit</p>
                                            
                                            <div className="mt-8 w-full space-y-4">
                                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                    <span className="material-symbols-outlined text-lg text-slate-400">mail</span>
                                                    <span className="text-[11px] font-bold text-slate-600 truncate">{admin.email}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                        <span className="material-symbols-outlined text-lg text-slate-400">call</span>
                                                        <span className="text-[10px] font-black text-slate-600">{admin.telephone || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                        <span className="material-symbols-outlined text-lg text-slate-400">location_on</span>
                                                        <span className="text-[10px] font-black text-slate-600 truncate">{admin.adresse || 'Tunis'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="mt-10 pt-8 border-t border-slate-50 w-full flex items-center justify-center gap-4">
                                                <button 
                                                    onClick={() => handleToggleStatus(admin.id)}
                                                    className={`h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
                                                        admin.enabled 
                                                            ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10' 
                                                            : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/10'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {admin.enabled ? 'block' : 'check_circle'}
                                                    </span>
                                                    {admin.enabled ? 'Désactiver' : 'Activer'}
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteAdmin(admin)}
                                                    className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/5"
                                                    title="Révoquer définitivement l'accès"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete_forever</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredNormalAdmins.length === 0 && (
                                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
                                        <div className="w-20 h-20 bg-white shadow-sm rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                                            <span className="material-symbols-outlined text-5xl">group_off</span>
                                        </div>
                                        <h5 className="text-xl font-black text-slate-900">Aucun Gardien Détecté</h5>
                                        <p className="text-slate-400 font-medium max-w-sm mx-auto mt-2">Affinez vos filtres ou déployez un nouvel administrateur via le cockpit de création ci-dessus.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* ===== ADMIN MANAGEMENT SECTION — END — SUPER ADMIN ONLY ===== */}
            </div>

            {/* ===== SECURITY DELETE MODAL — START ===== */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-fadeIn">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => !isDeleting && setShowDeleteModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-slideUp">
                        <div className="p-10 bg-red-50/50 border-b border-red-50 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-red-500">
                                <span className="material-symbols-outlined text-4xl font-black">gpp_maybe</span>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-900 text-xl tracking-tight uppercase">Révocation Critique</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Protocole de sécurité SMART INSPECT</p>
                            </div>
                        </div>

                        <div className="p-10">
                            <p className="text-slate-500 font-medium leading-relaxed mb-8">
                                Êtes-vous certain de vouloir supprimer définitivement l'accès de <strong className="text-slate-900">{adminToDestroy?.prenom} {adminToDestroy?.nom}</strong> ? Cette action est irréversible.
                            </p>

                            <div className="form-group-admin mb-8">
                                <label className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-3 block">
                                    Vérification de sécurité requise
                                </label>
                                <p className="text-[11px] text-slate-400 mb-4 font-bold">
                                    Veuillez saisir l'email <span className="text-slate-900 font-black">{adminToDestroy?.email}</span> pour confirmer.
                                </p>
                                <input 
                                    type="text" 
                                    placeholder="Saisissez l'email de l'admin..."
                                    value={deleteConfirmInput}
                                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                                    className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 font-bold text-slate-900 focus:border-red-500 focus:bg-white transition-all"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="flex-1 h-14 rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100"
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={handleConfirmDestroy}
                                    disabled={isDeleting || deleteConfirmInput !== adminToDestroy?.email}
                                    className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 hover:bg-red-600 transition-all"
                                >
                                    {isDeleting ? 'Révocation...' : 'RÉVOQUER L\'ACCÈS'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* ===== SECURITY DELETE MODAL — END ===== */}
        </AdminLayout>
    );
};

export default AdminProfilePage;
