import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import UserLayout from '../components/UserLayout';
import './DashboardPage.css';
import './InspectionPage.css';

const InspectionPage = () => {
    // Mode: 'idle' | 'webcam' | 'preview'
    const [mode, setMode] = useState('idle');
    const [imagePreview, setImagePreview] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveToast, setSaveToast] = useState('');
    const [saved, setSaved] = useState(false);
    const fileInputRef = useRef(null);
    const webcamRef = useRef(null);

    // ── Mission Conformity Context ──
    const activeMissionId = localStorage.getItem('activeMissionId');
    const activeMissionPiece = localStorage.getItem('activeMissionPiece') || '';
    const activeMissionRef = localStorage.getItem('activeMissionRef') || '';
    const hasMissionContext = !!activeMissionId;

    // Normalize: remove underscores, extra spaces, lowercase
    const normalize = (s) => s.replace(/_/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

    // Stop words to ignore (too generic to be meaningful)
    const STOP_WORDS = new Set(['carte', 'de', 'la', 'le', 'du', 'des', 'les', 'un', 'une', 'par', 'sur', 'en', 'et']);

    // Extract SPECIFIC technical keywords (longer than 3 chars and not a stop word)
    const getKeywords = (s) => normalize(s).split(' ').filter(w => w.length > 3 && !STOP_WORDS.has(w));

    // Conformity check: specific technical keywords must overlap
    const pieceDetected = result?.nom_piece || '';
    const isConformiteMission = !hasMissionContext || !result || (() => {
        const detectedNorm = normalize(pieceDetected);
        const expectedNorm = normalize(activeMissionPiece);
        // Direct inclusion check first
        if (detectedNorm.includes(expectedNorm) || expectedNorm.includes(detectedNorm)) return true;
        // Specific keyword overlap check (no generic words)
        const expectedKeywords = getKeywords(activeMissionPiece);
        const detectedKeywords = getKeywords(pieceDetected);
        // Must have at least one specific keyword in common
        return expectedKeywords.some(kw => detectedNorm.includes(kw)) &&
            detectedKeywords.some(kw => expectedNorm.includes(kw));
    })();
    const conformityError = result && hasMissionContext && !isConformiteMission
        ? `Erreur : La pièce détectée ("${pieceDetected}") ne correspond pas à la mission assignée (Attendu : "${activeMissionPiece}").`
        : '';

    // --- Image handling ---
    const handleImageReady = (dataUrl) => {
        setImagePreview(dataUrl);
        setResult(null);
        setError('');
        setMode('preview');
    };

    const handleFileSelect = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setError("Veuillez sélectionner un fichier image valide.");
            return;
        }
        setError('');
        const reader = new FileReader();
        reader.onloadend = () => handleImageReady(reader.result);
        reader.readAsDataURL(file);
    };

    const handleFileInputChange = (e) => {
        if (e.target.files[0]) handleFileSelect(e.target.files[0]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
    };

    // --- Webcam capture ---
    const handleCapture = useCallback(() => {
        if (!webcamRef.current) return;
        const screenshot = webcamRef.current.getScreenshot();
        if (screenshot) handleImageReady(screenshot);
    }, [webcamRef]);

    const openWebcam = () => {
        setResult(null);
        setError('');
        setImagePreview(null);
        setMode('webcam');
    };

    // --- Reset ---
    const handleReset = () => {
        setImagePreview(null);
        setResult(null);
        setError('');
        setSaveToast('');
        setSaved(false);
        setMode('idle');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // --- Confirm & Save to DB ---
    const handleConfirm = async () => {
        if (!result || saved) return;
        // Block if mission conformity check fails
        if (conformityError) return;
        setIsSaving(true);
        try {
            const inspecteurEmail = localStorage.getItem('userEmail') || 'inconnu@smart-inspect.com';
            const inspecteurNom = localStorage.getItem('userName') || 'Inspecteur';
            const payload = {
                nomPiece: result.nom_piece,
                tauxConfiance: result.confidence,
                anomalie: result.anomalie,
                resultat: result.conformite,
                tempsAnalyse: result.inference_time + 's',
                imageData: imagePreview,
                inspecteurEmail,
                inspecteurNom,
            };
            // Attach missionId to auto-complete the mission
            if (activeMissionId) payload.missionId = parseInt(activeMissionId, 10);

            const response = await fetch('/api/inspections/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (data.success) {
                setSaved(true);
                setSaveToast(` ✅ Inspection ${data.id} enregistrée${activeMissionId ? ` — Mission ${activeMissionRef} marquée Terminée !` : ' avec succès !'}`);
                // Clear mission context after successful save
                localStorage.removeItem('activeMissionId');
                localStorage.removeItem('activeMissionPiece');
                localStorage.removeItem('activeMissionRef');
                setTimeout(() => setSaveToast(''), 5000);
            } else {
                setSaveToast('❌ ' + (data.message || 'Erreur lors de la sauvegarde.'));
            }
        } catch (e) {
            setSaveToast('❌ Erreur de connexion au serveur.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- AI Analysis ---
    const handleAnalyze = async () => {
        if (!imagePreview) { setError("Veuillez d'abord capturer ou importer une image."); return; }
        setIsAnalyzing(true);
        setError('');
        setResult(null);
        try {
            const response = await fetch('/api/inspect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imagePreview }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || errData.error || "Erreur lors de l'analyse.");
            }
            setResult(await response.json());
        } catch (err) {
            setError(err.message || "Erreur de connexion au service IA.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const isConforme = result?.conformite === 'CONFORME';
    const canConfirm = result && !isSaving && !saved && !conformityError;

    // ---- Render camera zone ----
    const renderCameraZone = () => {
        if (mode === 'webcam') {
            return (
                <div className="relative w-full" style={{ height: '350px', background: '#000', borderRadius: '16px', overflow: 'hidden' }}>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        videoConstraints={{ facingMode: 'environment' }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* Live badge */}
                    <div style={{
                        position: 'absolute', top: '1rem', left: '1rem',
                        background: 'rgba(0,0,0,0.6)', color: 'white',
                        padding: '4px 12px', borderRadius: '999px',
                        fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px'
                    }}>
                        <span style={{ width: 6, height: 6, background: '#ef4444', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        LIVE FEED
                    </div>
                    {/* Capture button overlay */}
                    <button
                        onClick={handleCapture}
                        style={{
                            position: 'absolute', bottom: '1.25rem', left: '50%', transform: 'translateX(-50%)',
                            background: '#ec5b13', color: 'white', border: '3px solid white',
                            borderRadius: '999px', padding: '0.75rem 2rem',
                            fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>photo_camera</span>
                        CAPTURER
                    </button>
                </div>
            );
        }

        if (mode === 'preview' && imagePreview) {
            return (
                <div className="relative w-full" style={{ height: '350px' }}>
                    <img
                        src={imagePreview}
                        alt="Pièce à analyser"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '16px', background: '#f8fafc' }}
                    />
                    {result && (
                        <div style={{
                            position: 'absolute', top: '12px', right: '12px',
                            padding: '6px 14px', borderRadius: '999px',
                            fontSize: '0.7rem', fontWeight: 900, letterSpacing: '0.1em',
                            background: isConforme ? '#22c55e' : '#ef4444',
                            color: 'white', boxShadow: isConforme ? '0 4px 12px rgba(34,197,94,0.4)' : '0 4px 12px rgba(239,68,68,0.4)'
                        }}>
                            {result.conformite}
                        </div>
                    )}
                    {isAnalyzing && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.6)', borderRadius: '16px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                            backdropFilter: 'blur(4px)'
                        }}>
                            <div style={{
                                width: 48, height: 48, borderRadius: '50%',
                                border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#ec5b13',
                                animation: 'spin 0.8s linear infinite'
                            }} />
                            <p style={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.1em' }}>
                                ANALYSE EN COURS...
                            </p>
                        </div>
                    )}
                </div>
            );
        }

        // Default: idle drop zone
        return (
            <div
                className="camera-placeholder"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                style={{
                    cursor: 'pointer', height: '350px',
                    border: isDragging ? '2px dashed #ec5b13' : '2px dashed #cbd5e1',
                    background: isDragging ? '#fff7ed' : '#f8fafc'
                }}
            >
                <span className="material-symbols-outlined camera-off-icon">cloud_upload</span>
                <p className="font-bold text-slate-500">Glissez une image ici</p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>ou cliquez pour sélectionner</p>
                <div className="camera-tip" style={{ marginTop: '1rem' }}>
                    <span className="info-tag">info</span>
                    <span>ASSUREZ-VOUS QUE L'IMAGE EST CLAIRE ET BIEN ÉCLAIRÉE</span>
                </div>
            </div>
        );
    };

    return (
        <UserLayout activePage="inspection">
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse {
                    0%, 100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239,68,68,0); }
                }
            `}</style>

            <div className="welcome-section" style={{ marginBottom: '2rem' }}>
                <h1 className="welcome-title text-3xl font-black text-slate-900">IA Image Inspection</h1>
                <p className="welcome-subtitle text-slate-500 mt-2">
                    Analysez vos cartes électroniques avec précision grâce au notre serice IA .
                </p>
            </div>

            {/* ── Mission Context Banner ── */}
            {hasMissionContext && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem 1.5rem',
                    borderRadius: '16px',
                    background: '#fff7ed',
                    border: '2px solid #fed7aa',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '12px',
                        background: '#ec5b13',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                        <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1.2rem' }}>assignment</span>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ea580c', marginBottom: '2px' }}>
                            Mission en cours — {activeMissionRef}
                        </p>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7c2d12' }}>
                            Pièce attendue : <span style={{ color: '#ec5b13' }}>{activeMissionPiece}</span>
                        </p>
                    </div>
                </div>
            )}

            {/* ── Conformity Error Banner ── */}
            {conformityError && (
                <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem 1.5rem',
                    borderRadius: '16px',
                    background: '#fef2f2',
                    border: '2px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <span className="material-symbols-outlined" style={{ color: '#dc2626', fontSize: '1.8rem', flexShrink: 0 }}>gpp_bad</span>
                    <p style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7f1d1d' }}>{conformityError}</p>
                </div>
            )}

            <div className="inspection-grid">
                {/* Left Column */}
                <div className="camera-column">
                    <div className="camera-view-card">
                        {renderCameraZone()}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        style={{ display: 'none' }}
                        onChange={handleFileInputChange}
                    />

                    {/* Action buttons */}
                    <div className="camera-actions-row">
                        <button
                            className="action-btn highlighted"
                            onClick={mode === 'webcam' ? handleCapture : openWebcam}
                        >
                            <span className="material-symbols-outlined">photo_camera</span>
                            <div className="btn-text">
                                <span>Prendre</span>
                                <span>une photo</span>
                            </div>
                        </button>
                        <button
                            className="action-btn gray"
                            onClick={() => { setMode('idle'); fileInputRef.current?.click(); }}
                        >
                            <span className="material-symbols-outlined">upload</span>
                            <div className="btn-text">
                                <span>Importer</span>
                                <span>une image</span>
                            </div>
                        </button>
                    </div>

                    <button
                        className={`btn-start-analysis ${(!imagePreview || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleAnalyze}
                        disabled={!imagePreview || isAnalyzing}
                    >
                        {isAnalyzing
                            ? <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            : <span className="material-symbols-outlined">neurology</span>
                        }
                        <span>{isAnalyzing ? 'ANALYSE EN COURS...' : "LANCER L'ANALYSE IA"}</span>
                    </button>

                    {error && (
                        <div style={{
                            marginTop: '1rem', padding: '1rem', background: '#fef2f2',
                            border: '1px solid #fecaca', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', gap: '10px', color: '#dc2626'
                        }}>
                            <span className="material-symbols-outlined">error</span>
                            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>{error}</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Results */}
                <div className="stats-column">
                    <div className="result-card">
                        <div className="card-header-new">
                            <span className="material-symbols-outlined header-icon">analytics</span>
                            <h2 className="card-title-new">Status de l'analyse</h2>
                            {result && (
                                <div style={{
                                    marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%',
                                    background: isConforme ? '#22c55e' : '#ef4444',
                                    animation: 'pulse 1.5s infinite'
                                }} />
                            )}
                        </div>

                        <div className="analysis-results-list">
                            <div className="result-item">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                    <span>Nom de la pièce</span>
                                </div>
                                <span className="item-value font-black text-slate-800">
                                    {result ? result.nom_piece : <span style={{ color: '#e2e8f0' }}>—</span>}
                                </span>
                            </div>

                            <div className="result-item">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">verified</span>
                                    <span>Conformité</span>
                                </div>
                                {result
                                    ? <span className={`status-badge-new ${isConforme ? 'conforme' : 'non-conforme'}`}>{result.conformite}</span>
                                    : <span style={{ color: '#e2e8f0', fontWeight: 700 }}>—</span>
                                }
                            </div>

                            <div className="result-item">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">error</span>
                                    <span>Type d'anomalie</span>
                                </div>
                                <span className="item-value font-bold" style={{ color: result ? (isConforme ? '#16a34a' : '#dc2626') : '#e2e8f0' }}>
                                    {result ? result.anomalie : '—'}
                                </span>
                            </div>

                            <div className="result-item">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">leaderboard</span>
                                    <span>Taux de confiance</span>
                                </div>
                                <span className="item-value font-black" style={{ fontSize: '1.1rem', color: '#ec5b13' }}>
                                    {result ? `${result.confidence}%` : <span style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 700 }}>—</span>}
                                </span>
                            </div>

                            <div className="result-item border-none">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">timer</span>
                                    <span>Temps d'analyse</span>
                                </div>
                                <span className="item-value font-bold" style={{ color: '#475569' }}>
                                    {result ? `${result.inference_time}s` : <span style={{ color: '#e2e8f0' }}>—</span>}
                                </span>
                            </div>
                        </div>

                        {/* Diagnostic Banner */}
                        {result && (
                            <div style={{
                                margin: '0 1.5rem 1.5rem',
                                padding: '1.25rem',
                                borderRadius: '20px',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                background: isConforme ? '#f0fdf4' : '#fef2f2',
                                border: `2px solid ${isConforme ? '#bbf7d0' : '#fecaca'}`
                            }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '14px', flexShrink: 0,
                                    background: isConforme ? '#22c55e' : '#ef4444',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1.5rem' }}>
                                        {isConforme ? 'check_circle' : 'dangerous'}
                                    </span>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: isConforme ? '#16a34a' : '#dc2626' }}>
                                        Diagnostic Final
                                    </p>
                                    <p style={{ fontWeight: 800, fontSize: '0.9rem', color: isConforme ? '#14532d' : '#7f1d1d', marginTop: '2px' }}>
                                        {isConforme ? 'Aucun défaut détecté — Pièce validée' : `Défaut détecté — ${result.anomalie}`}
                                    </p>
                                </div>
                            </div>
                        )}

                        {saveToast && (
                            <div style={{
                                margin: '0 1.5rem 1rem',
                                padding: '1rem 1.25rem',
                                borderRadius: '16px',
                                background: saveToast.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                                border: `1px solid ${saveToast.startsWith('✅') ? '#bbf7d0' : '#fecaca'}`,
                                color: saveToast.startsWith('✅') ? '#15803d' : '#dc2626',
                                fontWeight: 800, fontSize: '0.85rem'
                            }}>
                                {saveToast}
                            </div>
                        )}

                        <div className="analysis-actions">
                            <button
                                className="btn-confirm-analysis"
                                disabled={!canConfirm}
                                onClick={handleConfirm}
                                style={{
                                    opacity: (!result || conformityError) ? 0.5 : saved ? 0.6 : 1,
                                    cursor: conformityError ? 'not-allowed' : 'pointer',
                                    background: conformityError ? '#94a3b8' : undefined
                                }}
                                title={conformityError || undefined}
                            >
                                {isSaving
                                    ? <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    : <span className="material-symbols-outlined">{conformityError ? 'block' : 'check_circle'}</span>
                                }
                                {saved ? 'Enregistré ✓' : isSaving ? 'Sauvegarde...' : conformityError ? 'Pièce incorrecte — Bloqué' : "Confirmer et Enregistrer"}
                            </button>
                            <button className="btn-retry-analysis" onClick={handleReset}>
                                <span className="material-symbols-outlined">refresh</span>
                                Nouvelle analyse
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="dashboard-footer">
                <span>© 2026 SMART INSPECT. Tous droits réservés.</span>
                <div className="footer-links">
                    <a href="#">Conditions d'utilisation</a>
                    <a href="#">Politique de confidentialité</a>
                    <a href="#">Support</a>
                </div>
            </footer>
        </UserLayout>
    );
};

export default InspectionPage;
