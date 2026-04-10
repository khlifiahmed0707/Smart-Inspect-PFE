import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import './DashboardPage.css';
import './InspectionPage.css';

const InspectionPage = () => {
    const navigate = useNavigate();

    return (
        <UserLayout activePage="inspection">
            <div className="welcome-section" style={{ marginBottom: '2rem' }}>
                <h1 className="welcome-title text-3xl font-black text-slate-900">IA Image Inspection</h1>
                <p className="welcome-subtitle text-slate-500 mt-2">Analysez vos produits avec précision.</p>
            </div>
            
            <div className="inspection-grid">
                {/* Same content as before */}
                <div className="camera-column">
                    <div className="camera-view-card">
                        <div className="camera-placeholder">
                            <span className="material-symbols-outlined camera-off-icon">videocam_off</span>
                            <p>Flux caméra inactif</p>
                            <div className="camera-tip">
                                <span className="info-tag">info</span>
                                <span>ASSUREZ-VOUS QUE L'IMAGE EST CLAIRE ET BIEN ÉCLAIRÉE</span>
                            </div>
                        </div>
                    </div>

                    <div className="camera-actions-row">
                        <button className="action-btn highlighted">
                            <span className="material-symbols-outlined">photo_camera</span>
                            <div className="btn-text">
                                <span>Prendre</span>
                                <span>une photo</span>
                            </div>
                        </button>
                        <button className="action-btn gray">
                            <span className="material-symbols-outlined">upload</span>
                            <div className="btn-text">
                                <span>Importer</span>
                                <span>une image</span>
                            </div>
                        </button>
                    </div>

                    <button className="btn-start-analysis">
                        <span className="material-symbols-outlined">neurology</span>
                        <span>LANCER L'ANALYSE IA</span>
                    </button>
                </div>

                <div className="stats-column">
                    <div className="result-card">
                        <div className="card-header-new">
                            <span className="material-symbols-outlined header-icon">analytics</span>
                            <h2 className="card-title-new">Status de l'analyse</h2>
                        </div>

                        <div className="analysis-results-list">
                            <div className="result-item">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">inventory_2</span>
                                    <span>Nom de la pièce</span>
                                </div>
                                <span className="item-value font-black text-slate-800">Turbine B-42</span>
                            </div>

                            <div className="result-item">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">verified</span>
                                    <span>Conformité</span>
                                </div>
                                <span className="status-badge-new conforme">CONFORME</span>
                            </div>

                            <div className="result-item">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">error</span>
                                    <span>Type d'anomalie</span>
                                </div>
                                <span className="item-value text-slate-500 font-bold">Aucune</span>
                            </div>

                            <div className="result-item">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">leaderboard</span>
                                    <span>Taux de confiance</span>
                                </div>
                                <span className="item-value text-orange-600 font-black text-lg">98.5%</span>
                            </div>

                            <div className="result-item border-none">
                                <div className="item-label">
                                    <span className="material-symbols-outlined">timer</span>
                                    <span>Temps d'analyse</span>
                                </div>
                                <span className="item-value text-slate-600 font-bold">1.2s</span>
                            </div>
                        </div>

                        <div className="analysis-actions">
                            <button className="btn-confirm-analysis">
                                <span className="material-symbols-outlined">check_circle</span>
                                Confirmer l'analyse
                            </button>
                            <button className="btn-retry-analysis" onClick={() => window.location.reload()}>
                                <span className="material-symbols-outlined">refresh</span>
                                Nouvelle analyse
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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

export default InspectionPage;
