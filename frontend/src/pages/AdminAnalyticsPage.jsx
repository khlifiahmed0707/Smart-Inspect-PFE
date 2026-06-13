import React, { useRef, useState, useEffect } from 'react';
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

    // --- LIVE DATA STATE ---
    const [globalStats, setGlobalStats] = useState({
        totalInspections: 0,
        avgConfidence: '0%',
        anomalies: 0,
        globalRate: [],
        pieceVolume: []
    });

    const [auditLogs, setAuditLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Tout");
    const [sort, setSort] = useState("dateInspection,desc");
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [counts, setCounts] = useState({ Tout: 0, Conforme: 0, Anomalies: 0 });
    const [selectedImage, setSelectedImage] = useState(null); // For Lightbox

    useEffect(() => {
        fetch('/api/admin/kpi/global-stats')
            .then(r => r.json())
            .then(data => setGlobalStats(data))
            .catch(err => console.error('Error fetching global stats:', err));
    }, []);

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
        const queryParams = new URLSearchParams({
            page,
            size,
            search,
            filter,
            sort
        });
        fetch(`/api/admin/kpi/paged-inspections?${queryParams.toString()}`)
            .then(r => r.json())
            .then(data => {
                setAuditLogs(data.content);
                setTotalPages(data.totalPages);
                setTotalItems(data.totalItems);
                setCounts({
                    Tout: data.countTout,
                    Conforme: data.countConforme,
                    Anomalies: data.countAnomalies
                });
            })
            .catch(err => console.error('Error fetching audit logs:', err));
    }, [page, size, search, filter, sort]);

    // --- GLOBAL CSV EXPORT ---
    const exportToCSV = () => {
        const headers = ["INSPECTEUR", "PIÈCE", "ID INSPECTION", "ANOMALIE", "RÉSULTAT", "CONFIANCE", "DATE", "HEURE"];
        const rows = auditLogs.map(log => {
            const d = new Date(log.date || new Date());
            const dateStr = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

            return [
                log.inspecteurNom,
                log.pieceName,
                log.idInspection,
                log.anomalie || "Aucune",
                log.resultat,
                `${Number(log.tauxConfiance || 0).toFixed(2)}%`,
                dateStr,
                timeStr
            ];
        });

        let csvContent = "\ufeff" + headers.map(h => `"${h}"`).join(";") + "\n"
            + rows.map(r => r.map(cell => `"${cell}"`).join(";")).join("\n");

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
        const timestamp = new Date(log.date || new Date()).toLocaleString('fr-FR');

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
        doc.text(`RAPPORT D'INSPECTION : ${log.idInspection}`, 190, 22, { align: 'right' });
        doc.setFont("helvetica", "normal");
        doc.text(`DATE D'ANALYSE : ${timestamp}`, 190, 31, { align: 'right' });

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
            if (log.imageData) {
                doc.setFillColor(248, 250, 252);
                doc.roundedRect(145, 70, 45, 45, 3, 3, 'F');
                doc.setDrawColor(226, 232, 240);
                doc.roundedRect(145, 70, 45, 45, 3, 3, 'D');
                doc.addImage(log.imageData, 'JPEG', 147.5, 72.5, 40, 40);
            }
        } catch (e) {
            console.error("Could not load image for PDF", e);
        }

        doc.setFont("helvetica", "normal");
        doc.setTextColor(33, 33, 33);
        doc.setFontSize(11);

        let yPos = 78;
        const details = [
            ["Nom de la pièce", log.pieceName],
            ["Identifiant Unique", log.idInspection],
            ["Inspecteur référent", log.inspecteurNom],
            ["Résultat Final", log.resultat],
            ["Temps d'Analyse", `${log.tempsAnalyse || '0.000'}s`]
        ];

        details.forEach(([label, value]) => {
            doc.setTextColor(148, 163, 184); // Slate-400
            doc.text(`${label}:`, 25, yPos);
            doc.setTextColor(15, 23, 42); // Slate-900
            doc.setFont("helvetica", "bold");
            doc.text(String(value), 70, yPos);
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
        const isOK = log.resultat === 'CONFORME';
        doc.setFillColor(isOK ? 240 : 254, isOK ? 253 : 242, isOK ? 244 : 242);
        doc.roundedRect(20, yPos, 170, 45, 4, 4, 'F');

        doc.setTextColor(isOK ? 21 : 153, isOK ? 128 : 27, isOK ? 61 : 27);
        doc.setFontSize(28);
        doc.setFont("helvetica", "bold");
        doc.text(log.resultat || "INCONNU", 105, yPos + 22, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`INDICE DE FIABILITÉ : ${Number(log.tauxConfiance || 0).toFixed(2)}%`, 105, yPos + 34, { align: 'center' });

        yPos += 65;
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(11);
        doc.text("Analyse détaillée des anomalies :", 20, yPos);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(log.anomalie === 'Aucune' ? 148 : 239, log.anomalie === 'Aucune' ? 163 : 68, log.anomalie === 'Aucune' ? 184 : 68);
        doc.text(log.anomalie || "AUCUNE ANOMALIE DÉTECTÉE", 85, yPos);

        // 5. Signature
        yPos += 40;
        doc.setFontSize(7);
        doc.setTextColor(203, 213, 225);
        doc.text("CERTIFIÉ PAR SMARTINSPECT IA V4", 155, yPos + 25, { align: 'center' });

        doc.save(`RAPPORT_${log.idInspection}.pdf`);
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
                        <h2 className="text-3xl font-black text-slate-900">Inspection des inspecteurs</h2>
                        <p className="text-slate-500 font-medium">Vision globale du système et performances de l'IA en temps réel.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Flux IA Synchrone</span>
                    </div>
                </div>

                {/* --- FILTERS OMITTED FOR CLEANER UI --- */}

                {/* Stats Grid - 3 cards only */}
                <div className="stats-grid-premium mb-10" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card-premium border border-slate-100/50">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-blue-50 text-blue-600">
                                <span className="material-symbols-outlined font-black">analytics</span>
                            </div>
                            <span className="stat-trend-tag">TOTAL</span>
                        </div>
                        <div className="card-bottom-info mt-6">
                            <p className="stat-label text-slate-400 font-black text-[10px] uppercase tracking-widest">Inspections Totales</p>
                            <p className="stat-val text-3xl font-black text-slate-900">{globalStats.totalInspections.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="stat-card-premium border border-slate-100/50">
                        <div className="card-top-flex">
                            <div className="stat-icon-box bg-green-50 text-green-600">
                                <span className="material-symbols-outlined font-black">verified</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-green-600 tracking-widest">{globalStats.avgConfidence}</span>
                                <div className="w-16 h-1.5 bg-green-100 rounded-full mt-1.5 overflow-hidden">
                                    <div className="bg-green-500 h-full" style={{ width: globalStats.avgConfidence }}></div>
                                </div>
                            </div>
                        </div>
                        <div className="card-bottom-info mt-6">
                            <p className="stat-label text-slate-400 font-black text-[10px] uppercase tracking-widest">Précision Moyenne</p>
                            <p className="stat-val text-3xl font-black text-green-600">{globalStats.avgConfidence}</p>
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
                            <p className="stat-val text-3xl font-black text-red-600">{globalStats.anomalies.toLocaleString()}</p>
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
                                <BarChart data={globalStats.globalRate} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
                                        {globalStats.globalRate.map((entry, index) => (
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
                                <BarChart data={globalStats.pieceVolume} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

                {/* Audit Logs Table with Filters & Search */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-10">

                    {/* Filter Bar Header */}
                    <div className="p-8 bg-slate-50/30 border-b border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between">

                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input
                                type="text"
                                placeholder="Rechercher par date, nom, CIN ou pièce..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Fast Filters */}
                        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/50">
                            {['Tout', 'Conforme', 'Anomalies'].map((f) => (
                                <button
                                    key={f}
                                    onClick={() => { setFilter(f); setPage(0); }}
                                    className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${filter === f
                                        ? 'bg-slate-900 text-white shadow-lg'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    {f} ({f === 'Tout' ? counts.Tout : f === 'Conforme' ? counts.Conforme : counts.Anomalies})
                                </button>
                            ))}
                        </div>
                        
                        {/* Sort Dropdown & Global Export */}
                        <div className="flex items-center gap-6">
                            <h1><b> Tableau Global D'inspection Des Inspecteur </b></h1>
                            <div className="flex items-center gap-3 pr-6 border-r border-slate-200">

                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trier par:</span>
                                <select
                                    value={sort}
                                    onChange={(e) => setSort(e.target.value)}
                                    className="bg-transparent text-sm font-black text-slate-900 border-none focus:ring-0 cursor-pointer"
                                >
                                    <option value="dateInspection,desc">Date (Récent)</option>
                                    <option value="dateInspection,asc">Date (Ancien)</option>
                                    <option value="tauxConfiance,desc">Précision (Max)</option>
                                    <option value="tauxConfiance,asc">Précision (Min)</option>
                                </select>
                            </div>

                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-3 text-orange-600 bg-white border border-orange-100 font-black text-[10px] px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-lg">description</span> Exporter Tout (Excel)
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="premium-table w-full">
                            <thead>
                                <tr className="bg-white">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Image</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">ID Inspection</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Nom de pièce</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Taux de confiance</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Anomalie</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Resultat</th>
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Temps</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center py-20 text-slate-400 font-bold">Aucune inspection trouvée</td></tr>
                                ) : auditLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-all border-b border-slate-50 last:border-0">
                                        <td className="px-8 py-6">
                                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-md group/img cursor-pointer" onClick={() => setSelectedImage(log.imageData)}>
                                                <img src={log.imageData ? (log.imageData.startsWith('data:') ? log.imageData : `data:image/jpeg;base64,${log.imageData}`) : "/placeholder-piece.jpg"} alt="Inspect" className="w-full h-full object-cover transition-transform group-hover/img:scale-110" />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="material-symbols-outlined text-white text-sm">fullscreen</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900">{log.idInspection}</span>
                                                <span className="text-[10px] font-bold text-slate-400 mt-1">{log.date ? new Date(log.date).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-sm font-black text-slate-900">{log.pieceName}</span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2 min-w-[120px]">
                                                <span className="text-sm font-black text-slate-900">{Number(log.tauxConfiance || 0).toFixed(2)}%</span>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${log.tauxConfiance >= 90 ? 'bg-green-500' : log.tauxConfiance >= 70 ? 'bg-orange-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${log.tauxConfiance}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`text-xs font-black uppercase tracking-tight ${log.resultat === 'CONFORME' ? 'text-slate-400' : 'text-red-500'}`}>
                                                {log.anomalie || 'Aucune (OK)'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${log.resultat === 'CONFORME'
                                                ? 'bg-green-50 text-green-600 border border-green-100'
                                                : 'bg-red-50 text-red-600 border border-red-100'
                                                }`}>
                                                {log.resultat === 'CONFORME' ? 'Conforme' : 'Non Conforme'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-black text-slate-500">{log.tempsAnalyse || '0.000'}s</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-4">
                                                <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                                                        <img src={log.inspecteurPhoto || "/default-avatar.png"} alt="Avatar" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase truncate max-w-[100px]">{log.inspecteurNom}</span>
                                                </div>
                                                <button
                                                    onClick={() => generatePDF(log)}
                                                    className="w-10 h-10 bg-white text-orange-600 border border-orange-100 rounded-xl hover:bg-orange-600 hover:text-white hover:shadow-lg transition-all flex items-center justify-center"
                                                >
                                                    <span className="material-symbols-outlined text-lg">download</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-8 bg-slate-50/30 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-black text-slate-400">
                            Affichage de <span className="text-slate-900">{page * size + 1}-{Math.min((page + 1) * size, totalItems)}</span> sur <span className="text-slate-900">{totalItems}</span> inspections
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-600 disabled:opacity-50 transition-all"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>

                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i
                                        ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                        : 'bg-white border border-slate-200 text-slate-500 hover:border-orange-500 hover:text-orange-600'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-600 disabled:opacity-50 transition-all"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lightbox Modal */}
                {selectedImage && (
                    <div
                        className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out transition-all"
                        onClick={() => setSelectedImage(null)}
                    >
                        <div
                            className="relative flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()} // Prevent close when clicking the image itself
                        >
                            {/* Close Button */}
                            <button
                                className="absolute -top-5 -right-5 w-10 h-10 bg-white/20 hover:bg-red-500 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30 shadow-xl transition-all z-10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedImage(null);
                                }}
                            >
                                <span className="material-symbols-outlined font-bold text-xl">close</span>
                            </button>

                            {/* Image */}
                            <img
                                src={selectedImage?.startsWith('data:') ? selectedImage : `data:image/jpeg;base64,${selectedImage}`}
                                alt="Large preview"
                                className="max-w-[80vw] max-h-[80vh] object-contain rounded-xl border border-white/20 shadow-2xl"
                            />
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminAnalyticsPage;
