import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import UserLayout from '../components/UserLayout';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import './DashboardPage.css';
import './HistoryPage.css';

const StatisticsPage = () => {
    const navigate = useNavigate();
    const dashboardRef = useRef(null);

    // Dynamic Identity
    const [userName, setUserName] = useState('Utilisateur');

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            setUserName(storedName);
        }
    }, []);

    // Global Statistics Values
    const stats = {
        totalAnalyzed: "1,240",
        avgConformity: "94.2%",
        defectsDetected: "48",
        avgTime: "1.2s"
    };

    // 1. Data for Global Summary Chart
    const globalSummaryData = [
        { name: 'Total Global', conforme: 1192, nonConforme: 48 }
    ];

    // 2. Data for Piece Performance
    const pieceDetailsData = [
        { name: 'Turbine B-42', conforme: 300, nonConforme: 20, total: 320 },
        { name: 'Control PCB', conforme: 370, nonConforme: 80, total: 450 },
        { name: 'Culasse H-700', conforme: 185, nonConforme: 25, total: 210 },
        { name: 'Injecteur X-1', conforme: 175, nonConforme: 5, total: 180 },
    ];

    const handleExportExcel = () => {
        try {
            const wb = XLSX.utils.book_new();
            const reportData = [
                ["RAPPORT ANALYTIQUE DE QUALITÉ - SMART INSPECT"],
                ["Inspecteur Référent", userName],
                ["Date du Rapport", new Date().toLocaleString()],
                [],
                ["SECTION 1 : STATISTIQUES GLOBALES"],
                ["Total Analysé", "Taux de Conformité", "Défauts Détectés", "Temps Moyen"],
                [stats.totalAnalyzed, stats.avgConformity, stats.defectsDetected, stats.avgTime],
                [],
                ["SECTION 2 : DÉTAILS PAR TYPE DE PIÈCE"],
                ["NOM DE LA PIÈCE", "TOTAL INSPECTIONS", "UNITÉS CONFORMES", "UNITÉS DÉFECTUEUSES", "TAUX RÉUSSITE (%)"],
                ...pieceDetailsData.map(p => [
                    p.name,
                    p.total,
                    p.conforme,
                    p.nonConforme,
                    ((p.conforme / p.total) * 100).toFixed(1) + "%"
                ])
            ];
            const ws = XLSX.utils.aoa_to_sheet(reportData);
            ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws, "Contrôle Qualité");
            const safeName = userName.replace(/\s+/g, '_');
            const filename = `Rapport_SmartInspect_${safeName}.xlsx`;
            XLSX.writeFile(wb, filename);
        } catch (error) {
            console.error("Export Failed", error);
        }
    };

    const handleExportPDF = async () => {
        const input = dashboardRef.current;
        if (!input) return;

        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#f8fafc"
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;

            // 1. Branding (Top Left)
            pdf.setTextColor(236, 91, 19); // Brand Orange #ec5b13
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.text("SMART INSPECT", margin, 12);

            // 2. Official Title (Centered Header)
            pdf.setTextColor(15, 23, 42); // slate-900
            pdf.setFontSize(18);
            pdf.setFont("helvetica", "bold");
            const title = "RAPPORT ANALYTIQUE DE QUALITÉ";
            const titleWidth = pdf.getStringUnitWidth(title) * 18 / pdf.internal.scaleFactor;
            pdf.text(title, (pageWidth - titleWidth) / 2, 25);

            // 3. Metadata (Split Left/Right)
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(71, 85, 105); // slate-600

            // Left: Inspector
            pdf.text(`Inspecteur : ${userName}`, margin, 35);

            // Right: Date
            const dateStr = `Date : ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
            const dateWidth = pdf.getStringUnitWidth(dateStr) * 10 / pdf.internal.scaleFactor;
            pdf.text(dateStr, pageWidth - margin - dateWidth, 35);

            // 4. Horizontal Separator
            pdf.setDrawColor(226, 232, 240); // slate-200
            pdf.line(margin, 38, pageWidth - margin, 38);

            // 5. Captured Dashboard Section (KPI Cards + Charts)
            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add image with adequate spacing from header
            pdf.addImage(imgData, 'PNG', margin, 45, imgWidth, imgHeight);

            // 6. Detailed Data Table
            let startY = 45 + imgHeight + 15;

            if (startY > pageHeight - 60) {
                pdf.addPage();
                startY = 20;
            }

            pdf.setTextColor(15, 23, 42);
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text("SYNTHÈSE DES PERFORMANCES PAR COMPOSANT", margin, startY);

            // Table Header Styling
            startY += 8;
            pdf.setFillColor(241, 245, 249); // slate-100 (Gris clair)
            // Border for header
            pdf.setDrawColor(203, 213, 225); // slate-300
            pdf.rect(margin, startY, pageWidth - (margin * 2), 10, 'FD');

            pdf.setFontSize(8);
            pdf.setTextColor(51, 65, 85); // slate-700
            pdf.setFont("helvetica", "bold");
            pdf.text("NOM DE LA PIÈCE", margin + 5, startY + 6.5);
            pdf.text("TOTAL INSPECTÉ", margin + 65, startY + 6.5);
            pdf.text("CONFORMES", margin + 100, startY + 6.5);
            pdf.text("DÉFAUTS", margin + 130, startY + 6.5);
            pdf.text("TAUX RÉUSSITE", margin + 160, startY + 6.5);

            // Table Body with Borders
            pieceDetailsData.forEach((p, idx) => {
                startY += 10;

                // Row Rectangle (Border only)
                pdf.setDrawColor(226, 232, 240); // slate-200
                pdf.rect(margin, startY, pageWidth - (margin * 2), 10);

                pdf.setTextColor(15, 23, 42);
                pdf.setFont("helvetica", "bold");
                pdf.text(p.name, margin + 5, startY + 6.5);

                pdf.setFont("helvetica", "normal");
                pdf.text(String(p.total), margin + 65, startY + 6.5);
                pdf.text(String(p.conforme), margin + 100, startY + 6.5);

                pdf.setTextColor(239, 68, 68); // red-500
                pdf.text(String(p.nonConforme), margin + 130, startY + 6.5);

                const rate = ((p.conforme / p.total) * 100).toFixed(1) + "%";
                pdf.setTextColor(34, 197, 94); // green-500
                pdf.setFont("helvetica", "bold");
                pdf.text(rate, margin + 160, startY + 6.5);
            });

            // 7. Footer
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(148, 163, 184); // slate-400
            pdf.text("Document certifié par SMART INSPECT Analysis System.", pageWidth / 2, pageHeight - 10, { align: 'center' });

            const safeName = userName.replace(/\s+/g, '_');
            pdf.save(`Rapport_Qualite_SmartInspect_${safeName}.pdf`);

        } catch (error) {
            console.error("PDF Export Failed", error);
        }
    };

    return (
        <UserLayout activePage="statistics">
            <div className="page-intro">
                <div className="intro-text">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Analytique & Performance</h1>
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
                {/* Global Stats Cards Section */}
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

                {/* Main Graphs Section */}
                <div className="grid grid-cols-12 gap-8 mb-12">
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

                    <div className="col-span-12 lg:col-span-6">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full">
                            <div className="mb-8">
                                <h3 className="text-xl font-black text-slate-800">Précision par équipement</h3>
                                <p className="text-slate-500 text-sm">Analyse cumulative de la fiabilité par composant</p>
                            </div>
                            <div style={{ width: '100%', height: 350 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pieceDetailsData} margin={{ top: 20, right: 10, left: 0, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#1e293b', fontWeight: 'bold', fontSize: 11 }}
                                            dy={10}
                                        />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 'bold', fontSize: 11 }} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontWeight: 'bold' }} />
                                        <Bar dataKey="conforme" name="Réussites" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} barSize={40} />
                                        <Bar dataKey="nonConforme" name="Défauts" stackId="a" fill="#ef4444" radius={[10, 10, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <footer className="dashboard-footer">
                <span>© 2024 SMART INSPECT. Auditeur en session : <span className="font-bold">{userName}</span></span>
                <div className="footer-links">
                    <a href="#">Support Technique</a>
                    <a href="#">Directives Qualité</a>
                </div>
            </footer>
        </UserLayout>
    );
};

export default StatisticsPage;
