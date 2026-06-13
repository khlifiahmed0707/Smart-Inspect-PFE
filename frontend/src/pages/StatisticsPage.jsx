import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './DashboardPage.css';
import './HistoryPage.css';

const StatisticsPage = () => {
    const navigate = useNavigate();
    const dashboardRef = useRef(null);
    const userName = localStorage.getItem('userName') || 'Utilisateur';
    const userEmail = localStorage.getItem('userEmail') || '';

    const [loading, setLoading] = useState(true);
    const [kpi, setKpi] = useState(null);

    // ---- Fetch KPIs from backend ----
    useEffect(() => {
        if (!userEmail) { setLoading(false); return; }
        fetch(`/api/inspections/kpi?email=${encodeURIComponent(userEmail)}`)
            .then(r => r.json())
            .then(data => { setKpi(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [userEmail]);

    // ---- Derived display values ----
    const stats = kpi ? {
        totalAnalyzed: kpi.totalAnalyzed.toLocaleString('fr-FR'),
        avgConformity: `${kpi.avgConformity}%`,
        defectsDetected: kpi.nonConformes.toString(),
        avgTime: kpi.avgTime,
    } : { totalAnalyzed: '—', avgConformity: '—', defectsDetected: '—', avgTime: '—' };

    const globalSummaryData = kpi?.globalSummary || [];
    const pieceDetailsData = kpi?.pieceDetails || [];
    const exportRows = kpi?.exportRows || [];

    // ---- Excel Export (données réelles) ----
    const handleExportExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            const reportData = [
                ["RAPPORT ANALYTIQUE DE QUALITÉ - SMART INSPECT"],
                ["Inspecteur Référent", userName],
                ["Date du Rapport", new Date().toLocaleString('fr-FR')],
                [],
                ["SECTION 1 : STATISTIQUES GLOBALES"],
                ["Total Analysé", "Taux de Conformité", "Défauts Détectés", "Temps Moyen"],
                [stats.totalAnalyzed, stats.avgConformity, stats.defectsDetected, stats.avgTime],
                [],
                ["SECTION 2 : DÉTAILS PAR TYPE DE PIÈCE"],
                ["NOM DE LA PIÈCE", "TOTAL INSPECTIONS", "UNITÉS CONFORMES", "UNITÉS DÉFECTUEUSES", "TAUX RÉUSSITE (%)"],
                ...pieceDetailsData.map(p => [
                    p.name, p.total, p.conforme, p.nonConforme,
                    p.total > 0 ? ((p.conforme / p.total) * 100).toFixed(1) + "%" : "N/A"
                ]),
                [],
                ["SECTION 3 : HISTORIQUE COMPLET DES INSPECTIONS"],
                ["ID INSPECTION", "NOM PIÈCE", "RÉSULTAT", "ANOMALIE", "CONFIANCE (%)", "TEMPS ANALYSE", "DATE"],
                ...exportRows.map(r => [
                    r.id, r.pieceName, r.resultat, r.anomalie,
                    r.tauxConfiance, r.tempsAnalyse, r.date
                ])
            ];
            const ws = XLSX.utils.aoa_to_sheet(reportData);
            ws['!cols'] = [{ wch: 25 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 15 }, { wch: 22 }];
            XLSX.utils.book_append_sheet(wb, ws, "Contrôle Qualité");
            XLSX.writeFile(wb, `Rapport_SmartInspect_${userName.replace(/\s+/g, '_')}.xlsx`);
        } catch (error) {
            console.error("Export Excel Failed", error);
        }
    };

    // ---- PDF Export ----
    const handleExportPDF = async () => {
        const input = dashboardRef.current;
        if (!input) return;
        try {
            const canvas = await html2canvas(input, { scale: 2, useCORS: true, backgroundColor: "#f8fafc" });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;

            pdf.setTextColor(236, 91, 19);
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.text("SMART INSPECT", margin, 12);

            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(16);
            pdf.text("RAPPORT ANALYTIQUE DE QUALITÉ", pageWidth / 2, 22, { align: 'center' });

            pdf.setFontSize(9);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(71, 85, 105);
            pdf.text(`Inspecteur : ${userName}`, margin, 32);
            pdf.text(`Date : ${new Date().toLocaleString('fr-FR')}`, pageWidth - margin, 32, { align: 'right' });
            pdf.setDrawColor(226, 232, 240);
            pdf.line(margin, 35, pageWidth - margin, 35);

            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', margin, 42, imgWidth, Math.min(imgHeight, pageHeight - 70));

            // Table on new page
            pdf.addPage();
            let y = 20;
            pdf.setFontSize(12); pdf.setFont("helvetica", "bold"); pdf.setTextColor(15, 23, 42);
            pdf.text("SYNTHÈSE PAR COMPOSANT", margin, y); y += 10;

            pdf.setFillColor(241, 245, 249);
            pdf.rect(margin, y, pageWidth - margin * 2, 9, 'F');
            pdf.setFontSize(7); pdf.setTextColor(51, 65, 85);
            pdf.text("NOM PIÈCE", margin + 3, y + 6);
            pdf.text("TOTAL", margin + 65, y + 6);
            pdf.text("CONFORMES", margin + 90, y + 6);
            pdf.text("DÉFAUTS", margin + 120, y + 6);
            pdf.text("TAUX", margin + 155, y + 6);
            y += 9;

            pieceDetailsData.forEach(p => {
                if (y > pageHeight - 20) { pdf.addPage(); y = 20; }
                pdf.setDrawColor(226, 232, 240);
                pdf.rect(margin, y, pageWidth - margin * 2, 8);
                pdf.setFont("helvetica", "bold"); pdf.setTextColor(15, 23, 42);
                pdf.text(String(p.name).substring(0, 30), margin + 3, y + 5.5);
                pdf.setFont("helvetica", "normal");
                pdf.text(String(p.total), margin + 65, y + 5.5);
                pdf.setTextColor(34, 197, 94); pdf.text(String(p.conforme), margin + 90, y + 5.5);
                pdf.setTextColor(239, 68, 68); pdf.text(String(p.nonConforme), margin + 120, y + 5.5);
                const rate = p.total > 0 ? ((p.conforme / p.total) * 100).toFixed(1) + "%" : "N/A";
                pdf.setTextColor(34, 197, 94); pdf.setFont("helvetica", "bold");
                pdf.text(rate, margin + 155, y + 5.5);
                y += 8;
            });

            pdf.setFontSize(8); pdf.setFont("helvetica", "italic"); pdf.setTextColor(148, 163, 184);
            pdf.text("Document certifié par SMART INSPECT Analysis System.", pageWidth / 2, pageHeight - 10, { align: 'center' });
            pdf.save(`Rapport_Qualite_SmartInspect_${userName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("PDF Export Failed", error);
        }
    };

    // ---- Loading skeleton ----
    if (loading) {
        return (
            <UserLayout activePage="statistics">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem', color: '#94a3b8' }}>
                    <div style={{ width: 40, height: 40, border: '4px solid #f1f5f9', borderTopColor: '#ec5b13', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Chargement des données analytiques...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </UserLayout>
        );
    }

    return (
        <UserLayout activePage="statistics">
            <div className="page-intro">
                <div className="intro-text">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Analyses et performances</h1>
                    <p className="text-slate-500 font-medium text-lg">Tableau de bord de {userName}. Suivi global et exportation des rapports.</p>
                </div>
                <div className="intro-actions flex flex-wrap gap-3">
                    <button
                        className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg active:scale-95 text-sm"
                        onClick={handleExportPDF}
                    >
                        <span className="material-symbols-outlined text-white">picture_as_pdf</span>
                        Exporter Rapport PDF
                    </button>
                    <button
                        className="bg-slate-950 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95 text-sm"
                        onClick={handleExportExcel}
                    >
                        <span className="material-symbols-outlined">download</span>
                        Exporter Rapport Excel
                    </button>
                    <button
                        className="bg-[#ec5b13] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#d14d0f] transition-all shadow-lg text-sm"
                        onClick={() => navigate('/inspection')}
                    >
                        <span className="material-symbols-outlined">add</span>
                        Nouvelle Analyse
                    </button>
                </div>
            </div>

            <div ref={dashboardRef} className="p-2">
                {/* KPI Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined text-3xl">image</span>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Analysé</p>
                            <p className="text-2xl font-black text-slate-800">{stats.totalAnalyzed}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <span className="material-symbols-outlined text-3xl">check_circle</span>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Taux Moyen</p>
                            <p className="text-2xl font-black text-green-600">{stats.avgConformity}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Anomalies</p>
                            <p className="text-2xl font-black text-red-600">{stats.defectsDetected}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                            <span className="material-symbols-outlined text-3xl">speed</span>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Analyse AVG</p>
                            <p className="text-2xl font-black text-slate-800">{stats.avgTime}</p>
                        </div>
                    </div>
                </section>

                {/* No data state */}
                {kpi && kpi.totalAnalyzed === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: 'white', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>bar_chart</span>
                        <p style={{ fontWeight: 800, fontSize: '1.1rem' }}>Aucune donnée disponible</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Effectuez et confirmez votre première inspection pour voir les graphiques.</p>
                    </div>
                )}

                {/* Charts — only shown when data exists */}
                {kpi && kpi.totalAnalyzed > 0 && (
                    <div className="grid grid-cols-12 gap-8 mb-12">
                        {/* Chart 1: Global Inspection */}
                        <div className="col-span-12 lg:col-span-6">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
                                <div className="mb-8">
                                    <h3 className="text-xl font-black text-slate-800">Inspection Global</h3>
                                    <p className="text-slate-500 text-sm">Répartition totale entre Conformité et Défauts</p>
                                </div>
                                <div style={{ width: '100%', height: 350 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={globalSummaryData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} hide />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold', fontSize: 12 }} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                                            <Bar dataKey="conforme" name="Total Conformes" fill="#22c55e" radius={[10, 10, 10, 10]} barSize={90} />
                                            <Bar dataKey="nonConforme" name="Total Défauts" fill="#ef4444" radius={[10, 10, 10, 10]} barSize={90} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Chart 2: By Equipment */}
                        <div className="col-span-12 lg:col-span-6">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
                                <div className="mb-8">
                                    <h3 className="text-xl font-black text-slate-800">Précision par équipement</h3>
                                    <p className="text-slate-500 text-sm">Analyse cumulative de la fiabilité par composant</p>
                                </div>
                                <div style={{ width: '100%', height: 350 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={pieceDetailsData} margin={{ top: 20, right: 10, left: 0, bottom: 40 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#1e293b', fontWeight: 'bold', fontSize: 9 }}
                                                interval={0}
                                                angle={-12}
                                                textAnchor="end"
                                                height={60}
                                            />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold', fontSize: 11 }} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                labelStyle={{ fontWeight: 'black', color: '#1e293b', marginBottom: '5px' }}
                                            />
                                            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold' }} />
                                            <Bar dataKey="conforme" name="Réussites" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={40} />
                                            <Bar dataKey="nonConforme" name="Défauts" stackId="a" fill="#ef4444" radius={[10, 10, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="dashboard-footer">
                <span>© 2026 SMART INSPECT. Auditeur en session : <span className="font-bold">{userName}</span></span>
                <div className="footer-links">
                    <a href="#">Support Technique</a>
                    <a href="#">Directives Qualité</a>
                </div>
            </footer>
        </UserLayout>
    );
};

export default StatisticsPage;
