import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import jsPDF from 'jspdf';
import './DashboardPage.css';
import './HistoryPage.css';

const HistoryPage = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem('userName') || 'Utilisateur';

    const [activeFilter, setActiveFilter] = useState('Tout');
    const [searchQuery, setSearchQuery] = useState('');
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [selectedImage, setSelectedImage] = useState(null); // Lightbox state

    // Escape key listener for Lightbox
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && selectedImage) {
                setSelectedImage(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage]);

    useEffect(() => {
        const email = localStorage.getItem('userEmail');
        if (!email) { setLoading(false); return; }
        setLoading(true);
        fetch(`/api/inspections/history?email=${encodeURIComponent(email)}&page=${currentPage - 1}&size=6`)
            .then(r => r.json())
            .then(data => {
                setHistoryData(data.content || []);
                setTotalPages(data.totalPages || 1);
                setTotalItems(data.totalItems || 0);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [currentPage]);

    const filteredData = historyData.filter(item => {
        const matchFilter = activeFilter === 'Tout' || item.status === activeFilter;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q ||
            item.id?.toLowerCase().includes(q) ||
            item.pieceName?.toLowerCase().includes(q) ||
            item.date?.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const totalAnomalies = historyData.filter(item => item.status === 'NON-CONFORME').length;

    // --- ULTRA-PREMIUM PDF GENERATION ---
    const generatePDF = (row) => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString('fr-FR');

        // 1. Header (Logo & Branding)
        doc.setFillColor(236, 91, 19); // Orange primary
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text("SMART INSPECT", 20, 22);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text("SYSTÈME D'ANALYSE IA INDUSTRIELLE V4.2", 20, 31);

        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(0.2);
        doc.line(20, 35, 75, 35);

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`RAPPORT D'INSPECTION : ${row.id}`, 190, 22, { align: 'right' });
        doc.setFont("helvetica", "normal");
        doc.text(`DATE D'ANALYSE : ${row.date}`, 190, 31, { align: 'right' });

        // 2. Body Separator
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(20, 55, 190, 55);

        // 3. Section: Information Pièce
        doc.setTextColor(71, 85, 105); // Slate-600
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("SECTION 01 : INFORMATIONS PIÈCE & SOURCE", 20, 65);

        // Piece Image Integration
        try {
            // Background box for image
            doc.setFillColor(248, 250, 252); // Slate-50
            doc.roundedRect(145, 70, 45, 45, 3, 3, 'F');
            doc.setDrawColor(226, 232, 240);
            doc.roundedRect(145, 70, 45, 45, 3, 3, 'D');

            // Image (Base64 or URL if supported by jsPDF environment)
            doc.addImage(row.img, 'JPEG', 147.5, 72.5, 40, 40);
        } catch (e) {
            console.error("Could not load image for PDF", e);
            doc.setFontSize(8);
            doc.setTextColor(203, 213, 225);
            doc.text("[ Image non disponible ]", 167.5, 93, { align: 'center' });
        }

        doc.setFont("helvetica", "normal");
        doc.setTextColor(33, 33, 33);
        doc.setFontSize(11);

        let yPos = 78;
        const details = [
            ["Nom de la pièce", row.pieceName],
            ["Identifiant Unique", row.id],
            ["Inspecteur référent", userName],
            ["Temps de traitement", row.time]
        ];

        details.forEach(([label, value]) => {
            doc.setTextColor(148, 163, 184); // Slate-400
            doc.text(`${label}:`, 25, yPos);
            doc.setTextColor(15, 23, 42); // Slate-900
            doc.setFont("helvetica", "bold");
            doc.text(value, 70, yPos);
            doc.setFont("helvetica", "normal");
            yPos += 9;
        });

        // 4. Section: Résultats d'Analyse
        doc.setDrawColor(241, 245, 249);
        doc.line(20, 125, 190, 125);

        yPos = 135;
        doc.setTextColor(71, 85, 105);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("SECTION 02 : RÉSULTATS DYNAMIQUE IA", 20, yPos);

        yPos += 15;
        // Result Highlight Box
        const isOK = row.status === 'CONFORME';
        doc.setFillColor(isOK ? 240 : 254, isOK ? 253 : 242, isOK ? 244 : 242);
        doc.roundedRect(20, yPos, 170, 45, 4, 4, 'F');

        doc.setTextColor(isOK ? 21 : 153, isOK ? 128 : 27, isOK ? 61 : 27);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text(isOK ? "CONFORME" : "NON CONFORME", 105, yPos + 22, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`INDICE DE FIABILITÉ : ${row.confidence}%`, 105, yPos + 34, { align: 'center' });

        yPos += 65;
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(11);
        doc.text("Analyse détaillée des anomalies :", 20, yPos);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(row.anomalyType === 'Aucune' ? 148 : 239, row.anomalyType === 'Aucune' ? 163 : 68, row.anomalyType === 'Aucune' ? 184 : 68);
        doc.text(row.anomalyType === 'Aucune' ? "AUCUNE ANOMALIE DÉTECTÉE PAR LE MODÈLE" : row.anomalyType.toUpperCase(), 85, yPos);

        // 5. Digital Signature Area (Simulated)
        yPos += 40;
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.roundedRect(120, yPos, 70, 30, 2, 2, 'D');
        doc.setFontSize(7);
        doc.setTextColor(203, 213, 225);
        doc.text("SIGNATURE ÉLECTRONIQUE IA", 155, yPos + 5, { align: 'center' });
        doc.text("Certifié par SmartInspect v4", 155, yPos + 25, { align: 'center' });

        // 6. Footer
        doc.setDrawColor(241, 245, 249);
        doc.line(20, 275, 190, 275);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "italic");
        doc.text(`Ce certificat digital a été généré via le Panel Utilisateur le ${timestamp}`, 105, 282, { align: 'center' });
        doc.text("SMART INSPECT AI - Solutions de Vision Industrielle", 105, 287, { align: 'center' });

        doc.save(`RAPPORT_ULTRAPRO_${row.id.replace('#', '')}.pdf`);
    };

    return (
        <UserLayout activePage="history">
            <div className="page-intro">
                <div className="intro-text">
                    <h1 className="text-3xl font-black text-slate-900">Journaux de qualité</h1>
                    <p className="text-slate-500 mt-2">Historique complet des inspections effectuées par lot.</p>
                </div>
                <div className="intro-actions">
                    <button className="btn-new-analys-hero" onClick={() => navigate('/inspection')}>
                        <span className="material-symbols-outlined">add</span>
                        Nouvelle Analyse
                    </button>
                </div>
            </div>

            <div className="summary-grid single-card">
                <div className="summary-card alerts-card">
                    <div className="card-content">
                        <span className="card-label">TOTAL ANOMALIES</span>
                        <span className="card-value">{String(historyData.filter(d => d.status === 'NON-CONFORME').length).padStart(2, '0')}</span>
                        <p className="card-subtext">Anomalies cumulées dans l'historique</p>
                    </div>
                    <div className="card-icon alert-icon">
                        <span className="material-symbols-outlined">report_problem</span>
                    </div>
                </div>
            </div>

            <div className="table-container">
                <h1><b>Historique des inspections</b></h1>
                <div className="table-filters-row">
                    <div className="search-filter">
                        <span className="material-symbols-outlined">search</span>
                        <input
                            type="text"
                            placeholder="Filtrer par ID, pièce, ou date..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="status-tabs-modern">
                        <button
                            className={`tab-btn tout ${activeFilter === 'Tout' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('Tout')}
                        >
                            Tout ({historyData.length})
                        </button>
                        <button
                            className={`tab-btn conforme ${activeFilter === 'CONFORME' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('CONFORME')}
                        >
                            Conforme ({historyData.filter(d => d.status === 'CONFORME').length})
                        </button>
                        <button
                            className={`tab-btn non-conforme ${activeFilter === 'NON-CONFORME' ? 'active' : ''}`}
                            onClick={() => setActiveFilter('NON-CONFORME')}
                        >
                            Anomalies ({historyData.filter(d => d.status === 'NON-CONFORME').length})
                        </button>
                    </div>
                    <div className="sort-filter">
                        <span className="label">TRIER PAR:</span>
                        <select>
                            <option>Date (Récent)</option>
                            <option>Confiance (+ Haut)</option>
                        </select>
                    </div>
                </div>

                <table className="history-table">
                    <thead>
                        <tr>
                            <th>IMAGE</th>
                            <th>ID INSPECTION</th>
                            <th>NOM DE PIÈCE</th>
                            <th>TAUX DE CONFIANCE</th>
                            <th>ANOMALIE</th>
                            <th>RESULTAT</th>
                            <th>TEMPS</th>
                            <th className="text-center">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: 32, height: 32, border: '3px solid #f1f5f9', borderTopColor: '#ec5b13', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Chargement de l'historique...</span>
                                </div>
                            </td></tr>
                        ) : filteredData.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>search_off</span>
                                <span style={{ fontWeight: 700 }}>Aucune inspection enregistrée</span>
                            </td></tr>
                        ) : filteredData.map((row, idx) => (
                            <tr key={idx}>
                                <td style={{ verticalAlign: 'middle' }}>
                                    <div className="img-cell">
                                        {row.img
                                            ? <img 
                                                src={row.img.startsWith('data:') ? row.img : `data:image/jpeg;base64,${row.img}`} 
                                                alt="Part" 
                                                style={{ width: '45px', height: '45px', objectFit: 'cover', cursor: 'zoom-in', borderRadius: '8px' }} 
                                                onClick={() => setSelectedImage(row.img.startsWith('data:') ? row.img : `data:image/jpeg;base64,${row.img}`)} 
                                              />
                                            : <div style={{ width: 48, height: 48, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>image_not_supported</span>
                                            </div>
                                        }
                                    </div>
                                </td>
                                <td>
                                    <div className="id-cell">
                                        <span className="id-text">{row.id}</span>
                                        <span className="date-text">{row.date}</span>
                                    </div>
                                </td>
                                <td><span className="piece-name-text font-bold text-slate-800">{row.pieceName}</span></td>
                                <td>
                                    <div className="confidence-cell">
                                        <span className="confidence-text">{row.confidence}%</span>
                                        <div className="progress-bar-small">
                                            <div className="progress" style={{
                                                width: `${row.confidence}%`,
                                                backgroundColor: row.confidence > 90 ? '#22c55e' : row.confidence > 70 ? '#f59e0b' : '#ef4444'
                                            }}></div>
                                        </div>
                                    </div>
                                </td>
                                <td><span className={`anomaly-type-text font-bold ${row.anomalyType === 'Aucune' ? 'text-slate-400' : 'text-red-500'}`}>{row.anomalyType}</span></td>
                                <td>
                                    <span className={`status-badge-new ${row.status === 'CONFORME' ? 'conforme' : 'non-conforme'}`}>
                                        {row.status === 'CONFORME' ? 'Conforme' : 'Non Conforme'}
                                    </span>
                                </td>
                                <td><span className="time-text">{row.time}</span></td>
                                <td className="text-center">
                                    <button className="action-btn-table" onClick={() => generatePDF(row)}>
                                        <span className="material-symbols-outlined">download</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Cards View */}
                <div className="history-cards-mobile">
                    {filteredData.map((row, idx) => (
                        <div key={idx} className="history-mobile-card">
                            <div className="card-header-mobile">
                                <span className="card-id-mobile">{row.id}</span>
                                <span className={`status-badge-new ${row.status === 'CONFORME' ? 'conforme' : 'non-conforme'}`}>
                                    {row.status === 'CONFORME' ? 'Conforme' : 'Non Conforme'}
                                </span>
                            </div>
                            <div className="card-body-mobile">
                                <div className="card-img-mobile">
                                    {row.img 
                                        ? <img 
                                            src={row.img.startsWith('data:') ? row.img : `data:image/jpeg;base64,${row.img}`} 
                                            alt="Part" 
                                            style={{ cursor: 'zoom-in' }}
                                            onClick={() => setSelectedImage(row.img.startsWith('data:') ? row.img : `data:image/jpeg;base64,${row.img}`)} 
                                          />
                                        : <div style={{ width: '100%', height: '100%', background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>image_not_supported</span>
                                          </div>
                                    }
                                </div>
                                <div className="card-info-mobile">
                                    <span className="piece-name-mobile font-black">{row.pieceName}</span>
                                    <span className="card-date-mobile">{row.date}</span>

                                    <div className="card-anomaly-mobile">
                                        <span className="label">Anomalie :</span>
                                        <span className={`value ${row.anomalyType === 'Aucune' ? 'text-slate-400' : 'text-red-500 font-bold'}`}>{row.anomalyType}</span>
                                    </div>

                                    <div className="card-metrics-mobile">
                                        <div className="metric-item">
                                            <span className="metric-label">Confiance</span>
                                            <span className="metric-value font-bold">{row.confidence}%</span>
                                        </div>
                                        <div className="metric-item">
                                            <span className="metric-label">Temps</span>
                                            <span className="metric-value">{row.time}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer-mobile">
                                <button className="btn-download-mobile" onClick={() => generatePDF(row)}>
                                    <span className="material-symbols-outlined">download</span>
                                    Rapport PDF
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="table-footer">
                    <span className="pagination-info">
                        Affichage de {historyData.length > 0 ? (currentPage - 1) * 6 + 1 : 0}-{Math.min(currentPage * 6, totalItems)} sur {totalItems} inspections
                    </span>
                    <div className="pagination-controls">
                        <button
                            className="page-btn"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(currentPage - 1)}
                            style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button
                            className="page-btn"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(currentPage + 1)}
                            style={{ opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1, cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer' }}
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
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

            {/* Lightbox Modal (Premium UI) */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out transition-all"
                    onClick={() => setSelectedImage(null)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', cursor: 'zoom-out' }}
                >
                    <div 
                        className="relative flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()} // Prevent close when clicking the image itself
                        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        {/* Close Button */}
                        <button 
                            className="absolute -top-5 -right-5 w-10 h-10 bg-white/20 hover:bg-red-500 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl transition-all z-10"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage(null);
                            }}
                            style={{ position: 'absolute', top: '-1.25rem', right: '-1.25rem', width: '2.5rem', height: '2.5rem', backgroundColor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', cursor: 'pointer', zIndex: 10 }}
                        >
                            <span className="material-symbols-outlined font-bold text-xl" style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>close</span>
                        </button>
                        
                        {/* Image */}
                        <img 
                            src={selectedImage?.startsWith('data:') ? selectedImage : `data:image/jpeg;base64,${selectedImage}`} 
                            alt="Large preview" 
                            className="max-w-[80vw] max-h-[80vh] object-contain rounded-xl border border-white/20 shadow-2xl"
                            style={{ maxWidth: '80vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                        />
                    </div>
                </div>
            )}
        </UserLayout>
    );
};

export default HistoryPage;
