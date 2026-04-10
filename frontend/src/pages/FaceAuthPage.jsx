import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import './FaceAuthPage.css';

const FaceAuthPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const webcamRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('tempAdminEmail')) {
            navigate('/login');
        }
    }, [navigate]);

    const handleCapture = async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;
        setLoading(true);
        setError('');
        try {
            const response = await fetch('http://127.0.0.1:8081/api/face/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: localStorage.getItem('tempAdminEmail'),
                    image: imageSrc
                }),
            });
            const data = await response.json();
            if (data.success) {
                const adminEmail = localStorage.getItem('tempAdminEmail');
                setIsSuccess(true);
                localStorage.setItem('userRole', 'SUPER_ADMIN');
                localStorage.setItem('userEmail', adminEmail);
                if (!localStorage.getItem('userName')) {
                    localStorage.setItem('userName', 'Super Admin');
                }
                localStorage.removeItem('tempAdminEmail');
                setTimeout(() => navigate('/admin'), 2000);
            } else {
                setAttempts(prev => prev + 1);
                setError(data.message);
                if (data.message.includes("bloqué")) setTimeout(() => navigate('/login'), 3000);
            }
        } catch (err) {
            setError("Erreur serveur.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.code === 'Space' && !loading && !isSuccess && attempts < 3) {
                e.preventDefault();
                handleCapture();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [loading, isSuccess, attempts]);

    return (
        <div className="face-auth-container">
            <div className="face-auth-split">
                {/* Left Side: Security Information */}
                <div className="face-auth-left">
                    <div className="face-auth-logo">
                        <div className="logo-icon">
                            <span className="material-symbols-outlined">security_update_good</span>
                        </div>
                        <span className="logo-text">SMART INSPECT</span>
                    </div>

                    <div className="face-auth-content">
                        <h1 className="face-auth-title">Sécurité renforcée pour l'accès admin</h1>
                        <p className="face-auth-subtitle">
                            Veuillez confirmer votre identité via reconnaissance faciale pour accéder au terminal de contrôle.
                        </p>

                        <div className="security-cards">
                            <div className="security-card">
                                <div className="card-icon warning">
                                    <span className="material-symbols-outlined">schedule</span>
                                </div>
                                <div className="card-info">
                                    <h3>Tentatives restantes: {3 - attempts}</h3>
                                    <p>Vérification biométrique multicouche</p>
                                </div>
                            </div>

                            <div className="security-card active">
                                <div className="card-icon success">
                                    <span className="material-symbols-outlined">verified_user</span>
                                </div>
                                <div className="card-info">
                                    <h3>Sécurité: Accès sécurisé</h3>
                                    <p>Chiffrement AES-256 de bout en bout</p>
                                </div>
                            </div>

                            <div className="security-card">
                                <div className="card-icon info">
                                    <span className="material-symbols-outlined">description</span>
                                </div>
                                <div className="card-info">
                                    <h3>Historique: Connexion loguée</h3>
                                    <p>Journal d'audit actif en temps réel</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="face-auth-footer">
                        <span>SYSTEM VERSION 4.0.2 • SECURE NODE 08</span>
                    </div>
                </div>

                {/* Right Side: Visual Identification Area */}
                <div className="face-auth-right">
                    <div className="auth-area-header">
                        <h2 className="auth-area-title">Identification Visuelle</h2>
                        <p className="auth-area-desc">
                            {isSuccess ? "✅ Accès accordé. Redirection..." : (
                                <>
                                    Positionnez votre visage au centre du cadre pour commencer.<br />
                                    <span className="text-xs opacity-70">Cliquez sur "Prendre une photo" ou appuyez sur <b>Espace</b> sur votre clavier.</span>
                                </>
                            )}
                        </p>
                    </div>

                    <div className="face-scanner-viewport">
                        <div className="live-feed-badge">
                            <span className="pulse-dot"></span>
                            LIVE FEED
                        </div>

                        {error && (
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-500/90 text-white px-4 py-2 rounded-lg text-xs font-bold border border-red-400 backdrop-blur-sm animate-bounce">
                                {error}
                            </div>
                        )}

                        {!isSuccess ? (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                className="face-scan-webcam"
                                videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
                            />
                        ) : (
                            <div className="success-overlay">
                                <span className="material-symbols-outlined text-white text-6xl">check_circle</span>
                            </div>
                        )}

                        <div className="scanner-frame">
                            <div className="frame-corner top-left"></div>
                            <div className="frame-corner top-right"></div>
                            <div className="frame-corner bottom-left"></div>
                            <div className="frame-corner bottom-right"></div>
                            <div className="scan-line"></div>
                            <div className="tracking-label">{loading ? "ANALYSE EN COURS..." : "FACE TRACKED"}</div>
                        </div>
                    </div>

                    <div className="instruction-banner">
                        <span className="material-symbols-outlined instruction-icon">lightbulb</span>
                        <p>Assurez-vous que votre visage est bien éclairé et visible sans accessoires (lunettes de soleil, masques).</p>
                    </div>

                    <button
                        className={`btn-take-photo ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        onClick={handleCapture}
                        disabled={loading || isSuccess || attempts >= 3}
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-white">photo_camera</span>
                                {isSuccess ? "Accès accordé" : "Prendre une photo"}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FaceAuthPage;
