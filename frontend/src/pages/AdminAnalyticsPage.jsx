import React, { useRef } from 'react';
import AdminLayout from '../components/AdminLayout';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

const AdminAnalyticsPage = () => {
    const adminName = localStorage.getItem('userName') || 'Administrateur';
    
    // Refs for PDF Export
    const globalRateChartRef = useRef(null);
    const volumeChartRef = useRef(null);

    // --- ENRICHED MOCK DATA ---
    const inspectionLogs = [
        {
            id: 1,
            inspecteur: "Sarah Dupont",
            role: "Opérateur Senior",
            initials: "SD",
            color: "orange",
            pieceName: "Turbine B-42",
            pieceId: "ID-88291",
            anomaly: "Aucune",
            filename: "CAM_01_SEC_241.jpg",
            thumbnail: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?auto=format&fit=crop&w=100&q=80",
            decision: "CONFORME",
            statusColor: "green",
            confidence: 98,
            date: "2024-04-07 14:30"
        },
        {
            id: 2,
            inspecteur: "Alex Miller",
            role: "Contrôleur Qualité",
            initials: "AM",
            color: "blue",
            pieceName: "Control PCB v4",
            pieceId: "ID-11024",
            anomaly: "Micro-fissure",
            filename: "CHIP_UNIT_771.png",
            thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=100&q=80",
            decision: "DÉFECTUEUX",
            statusColor: "red",
            confidence: 94,
            date: "2024-04-07 12:15"
        },
        {
            id: 3,
            inspecteur: "Marc L.",
            role: "Technicien IA",
            initials: "ML",
            color: "green",
            pieceName: "Aile Airbus v2",
            pieceId: "ID-99381",
            anomaly: "Rayure Surface",
            filename: "WING_SCAN_09.webp",
            thumbnail: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=100&q=80",
            decision: "DÉFECTUEUX",
            statusColor: "red",
            confidence: 89,
            date: "2024-04-07 10:05"
        }
    ];

    // --- CHART DATA (GLOBAL VIEW) ---
    const globalPerformanceData = [
        { name: 'Unités Conformes', value: 84, color: '#22c55e' },
        { name: 'Unités Défectueuses', value: 16, color: '#ef4444' }
    ];

    const pieceVolumeData = [
        { name: 'Turbine B-42', total: 1240 },
        { name: 'Control PCB', total: 980 },
        { name: 'Aile Airbus', total: 650 },
        { name: 'Pump Axial', total: 420 },
        { name: 'Sensor V8', total: 310 }
    ];

    // --- GLOBAL CSV EXPORT (EXCEL OPTIMIZED - semicolon for FR region) ---
    const exportToCSV = () => {
        const headers = ["INSPECTEUR", "PIÈCE", "ID PIÈCE", "ANOMALIE", "RÉSULTAT", "CONFIANCE", "DATE"];
        const rows = inspectionLogs.map(log => [
            log.inspecteur,
            log.pieceName,
            log.pieceId,
            log.anomaly,
            log.decision,
            `${log.confidence}%`,
            log.date
        ]);

        // Prepend BOM (\ufeff) and use semicolon (;) for better column detection in Excel
        let csvContent = "\ufeff" + headers.join(";") + "\n"
            + rows.map(r => r.join(";")).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rapport_inspections_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- ULTRA-PREMIUM PDF EXPORT (WITH IMAGE) ---
    const generatePDF = (log) => {
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
        doc.text(`RAPPORT D'INSPECTION : ${log.pieceId}`, 190, 22, { align: 'right' });
        doc.setFont("helvetica", "normal");
        doc.text(`DATE D'ANALYSE : ${log.date}`, 190, 31, { align: 'right' });

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

            // Image (Thumbnail)
            doc.addImage(log.thumbnail, 'JPEG', 147.5, 72.5, 40, 40);
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
            ["Nom de la pièce", log.pieceName],
            ["Identifiant Unique", log.pieceId],
            ["Fichier Source", log.filename],
            ["Inspecteur référent", log.inspecteur],
            ["Rôle Opérateur", log.role]
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
        const isOK = log.decision === 'CONFORME';
        doc.setFillColor(isOK ? 240 : 254, isOK ? 253 : 242, isOK ? 244 : 242);
        doc.roundedRect(20, yPos, 170, 45, 4, 4, 'F');

        doc.setTextColor(isOK ? 21 : 153, isOK ? 128 : 27, isOK ? 61 : 27);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text(log.decision, 105, yPos + 22, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`INDICE DE FIABILITÉ : ${log.confidence}%`, 105, yPos + 34, { align: 'center' });

        yPos += 65;
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(11);
        doc.text("Analyse détaillée des anomalies :", 20, yPos);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(log.anomaly === 'Aucune' ? 148 : 239, log.anomaly === 'Aucune' ? 163 : 68, log.anomaly === 'Aucune' ? 184 : 68);
        doc.text(log.anomaly === 'Aucune' ? "AUCUNE ANOMALIE DÉTECTÉE PAR LE MODÈLE" : log.anomaly.toUpperCase(), 85, yPos);

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
        doc.text(`Ce certificat digital a été généré via le Panel Admin le ${timestamp}`, 105, 282, { align: 'center' });
        doc.text("SMART INSPECT AI - Solutions de Vision Industrielle", 105, 287, { align: 'center' });

        doc.save(`RAPPORT_ULTRAPRO_${log.pieceId}.pdf`);
    };

    // --- DYNAMIC CHART TO PDF EXPORT ---
    const exportChartToPDF = async (chartRef, title, filename) => {
        if (!chartRef.current) return;
        try {
            const canvas = await html2canvas(chartRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('landscape', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            // Header for Chart PDF
            pdf.setFillColor(236, 91, 19); 
            pdf.rect(0, 0, pdfWidth, 20, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            pdf.text("SMART INSPECT - " + title, 10, 13);
            
            // Render Chart Image
            pdf.addImage(imgData, 'PNG', 10, 30, pdfWidth - 20, pdfHeight - 20); // Keep margins
            
            pdf.save(`${filename}_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error("Failed to generate Chart PDF:", error);
        }
    };

    return (

        <AdminLayout activePage="analytics">
            <div className="admin-content-premium">
                <div className="page-intro-admin flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Historique global d'inspection</h2>
                        <p className="text-slate-500 font-medium">Vision globale du système et performances de l'IA en temps réel.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Flux IA Synchrone</span>
                    </div>
                </div>

                {/* --- FILTERS OMITTED FOR CLEANER UI --- */}

                {/* Stats Grid */}
                <div className="stats-grid-premium mb-10">
                    <div className="stat-card-premium border border-slate-100/50">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-orange-50 text-orange-600">
                                <span className="material-symbols-outlined font-black">hub</span>
                            </div>
                            <span className="stat-trend-tag">+12%</span>
                        </div>
                        <div className="card-bottom-info mt-6">
                            <p className="stat-label text-slate-400 font-black text-[10px] uppercase tracking-widest">Inspecteurs Actifs</p>
                            <p className="stat-val text-3xl font-black text-slate-900">1,284</p>
                        </div>
                    </div>
                    <div className="stat-card-premium border border-slate-100/50">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-blue-50 text-blue-600">
                                <span className="material-symbols-outlined font-black">analytics</span>
                            </div>
                            <span className="stat-trend-tag">+5.4%</span>
                        </div>
                        <div className="card-bottom-info mt-6">
                            <p className="stat-label text-slate-400 font-black text-[10px] uppercase tracking-widest">Inspections Totales</p>
                            <p className="stat-val text-3xl font-black text-slate-900">42,619</p>
                        </div>
                    </div>
                    <div className="stat-card-premium border border-slate-100/50">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-green-50 text-green-600">
                                <span className="material-symbols-outlined font-black">verified</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-green-600 tracking-widest">94.2%</span>
                                <div className="w-16 h-1.5 bg-green-100 rounded-full mt-1.5 overflow-hidden">
                                    <div className="bg-green-500 h-full w-[94%]"></div>
                                </div>
                            </div>
                        </div>
                        <div className="card-bottom-info mt-6">
                            <p className="stat-label text-slate-400 font-black text-[10px] uppercase tracking-widest">Précision Moyenne</p>
                            <p className="stat-val text-3xl font-black text-green-600">94.2%</p>
                        </div>
                    </div>
                    <div className="stat-card-premium border border-slate-100/50">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-red-50 text-red-600">
                                <span className="material-symbols-outlined font-black">warning</span>
                            </div>
                            <span className="stat-trend-tag bg-red-50 text-red-500">ALERTE</span>
                        </div>
                        <div className="card-bottom-info mt-6">
                            <p className="stat-label text-slate-400 font-black text-[10px] uppercase tracking-widest">Anomalies Détectées</p>
                            <p className="stat-val text-3xl font-black text-red-600">2,481</p>
                        </div>
                    </div>
                </div>

                {/* Analytical Charts - Global View Upgrade */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    
                    {/* Chart 1: Global Inspection Rate */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between" ref={globalRateChartRef}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h4 className="font-black text-slate-900 text-lg">Taux d'Inspection Global</h4>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Réussite vs Échec total</p>
                            </div>
                            <button 
                                onClick={() => exportChartToPDF(globalRateChartRef, "Taux d'Inspection Global", "Taux_Global")}
                                className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl flex items-center justify-center transition-colors"
                                title="Exporter le graphique en PDF"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={globalPerformanceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                        {globalPerformanceData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart 2: Volume by Piece Type */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between" ref={volumeChartRef}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h4 className="font-black text-slate-900 text-lg">Volume d'Inspection par Pièce</h4>
                                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Répartition stratégique de la charge</p>
                            </div>
                            <button 
                                onClick={() => exportChartToPDF(volumeChartRef, "Volume d'Inspection par Pièce", "Volume_Piece")}
                                className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl flex items-center justify-center transition-colors"
                                title="Exporter le graphique en PDF"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                            </button>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pieceVolumeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'medium' }}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="total" fill="#ec5b13" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Audit Logs Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-10">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h4 className="font-black text-slate-900 text-xl tracking-tight">Piste d'Audit des Inspections</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Logs de décision en temps réel</p>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="flex items-center gap-3 text-orange-600 bg-white border border-orange-100 font-black text-[10px] px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all uppercase tracking-widest"
                        >
                            <span className="material-symbols-outlined text-lg">download</span> Exporter le Rapport (CSV)
                        </button>
                    </div>
                    {/* --- MOBILE CARD VIEW (Hidden on Desktop) --- */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                        {inspectionLogs.map((log) => (
                            <div key={log.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                                            <img src={log.thumbnail} alt="Piece" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <h5 className="text-sm font-black text-slate-900">{log.pieceName}</h5>
                                            <span className="text-[10px] font-black text-slate-400">#{log.pieceId}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => generatePDF(log)}
                                        className="w-10 h-10 bg-white text-orange-600 rounded-xl shadow-sm border border-orange-50 flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined text-lg">download</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Résultat</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 bg-${log.statusColor}-500 rounded-full`}></div>
                                            <span className={`text-[10px] font-black text-${log.statusColor}-600`}>{log.decision}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Confiance</p>
                                        <span className="text-[10px] font-black text-slate-900">{log.confidence}%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100/50">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-lg bg-${log.color}-100 text-${log.color}-600 flex items-center justify-center font-black text-[8px]`}>
                                            {log.initials}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{log.inspecteur}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 italic">{log.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* --- DESKTOP TABLE VIEW (Hidden on Mobile) --- */}
                    <div className="overflow-x-auto hidden md:block">
                        <table className="premium-table w-full">
                            <thead>
                                <tr className="bg-white">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[200px]">Inspecteur</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[150px]">Image Inspectée</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Nom de pièce</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">ID Pièce</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Décision IA</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Type d'anomalie</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Confiance</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Rapport</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inspectionLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0 group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl bg-${log.color}-100 text-${log.color}-600 flex items-center justify-center font-black text-xs shadow-inner`}>
                                                    {log.initials}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{log.inspecteur}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{log.role}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm">
                                                    <img src={log.thumbnail} alt="Inspect" className="w-full h-full object-cover" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{log.filename}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-slate-700">{log.pieceName}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">#{log.pieceId}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 bg-${log.statusColor}-500 rounded-full`}></div>
                                                <span className={`text-[10px] font-black text-${log.statusColor}-600 uppercase tracking-widest`}>{log.decision}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-[10px] font-black ${log.anomaly === 'Aucune' ? 'text-slate-400' : 'text-red-500'} uppercase tracking-widest`}>{log.anomaly}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 min-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full bg-${log.statusColor === 'green' ? 'green' : 'orange'}-500`} style={{ width: `${log.confidence}%` }}></div>
                                                </div>
                                                <span className="text-xs font-black text-slate-700">{log.confidence}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => generatePDF(log)}
                                                className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-orange-600 hover:text-white transition-all shadow-sm flex items-center justify-center ml-auto"
                                                title="Télécharger le rapport PDF"
                                            >
                                                <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAnalyticsPage;
