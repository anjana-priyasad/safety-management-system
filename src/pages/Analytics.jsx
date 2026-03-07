import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileText, Download, Printer, Activity, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

// ✅ නිවැරදි Imports
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Analytics = () => {
    // State for KPIs and Charts
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({
        totalIncidents: 0,
        openHazards: 0,
        completedInspections: 0,
        safeManHours: 12500 // Static placeholder for now
    });

    const [incidentTrend, setIncidentTrend] = useState([]);
    const [severityData, setSeverityData] = useState([]);
    const [hazardStatusData, setHazardStatusData] = useState([]);
    const [incidentsList, setIncidentsList] = useState([]);

    const COLORS_SEVERITY = {
        'Low': '#10b981', // green
        'Medium': '#f59e0b', // yellow/orange
        'High': '#f97316', // orange
        'Critical': '#ef4444' // red
    };

    const COLORS_STATUS = ['#ef4444', '#10b981']; // Open (Red), Resolved (Green)

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get Company ID
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            const companyId = profile?.company_id;
            if (!companyId) return;

            // 1. Fetch Incidents (Current Month & Trend)
            const { data: incidents } = await supabase
                .from('incidents')
                .select('*')
                .eq('company_id', companyId)
                .order('created_at', { ascending: true });

            // 2. Fetch Hazards
            const { data: hazards } = await supabase
                .from('hazards')
                .select('*')
                .eq('company_id', companyId);

            // 3. Fetch Inspections
            const { count: insCount } = await supabase
                .from('inspection_submissions')
                .select('*', { count: 'exact' })
                .eq('company_id', companyId)
                .eq('status', 'completed');

            // --- PROCESS DATA ---

            // KPIs
            const openHazardsCount = hazards?.filter(h => h.status === 'Open').length || 0;
            const currentMonthIncidents = incidents?.filter(i => {
                const d = new Date(i.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length || 0;

            setKpis(prev => ({
                ...prev,
                totalIncidents: currentMonthIncidents,
                openHazards: openHazardsCount,
                completedInspections: insCount || 0
            }));

            setIncidentsList(incidents || []);

            // Chart: Incidents by Severity
            const severityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
            incidents?.forEach(inc => {
                const sev = inc.severity || 'Low';
                if (severityCounts[sev] !== undefined) severityCounts[sev]++;
            });
            const sevChartData = Object.keys(severityCounts).map(key => ({
                name: key,
                value: severityCounts[key],
                fill: COLORS_SEVERITY[key]
            }));
            setSeverityData(sevChartData);

            // Chart: Hazard Status
            const hazResolved = hazards?.filter(h => h.status === 'Resolved').length || 0;
            const hazOpen = (hazards?.length || 0) - hazResolved;
            setHazardStatusData([
                { name: 'Open', value: hazOpen },
                { name: 'Resolved', value: hazResolved }
            ]);

            // Chart: Trend (Last 6 Months)
            const trendMap = {};
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const now = new Date();

            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
                trendMap[key] = 0;
            }

            incidents?.forEach(inc => {
                const d = new Date(inc.created_at);
                const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
                if (trendMap[key] !== undefined) trendMap[key]++;
            });

            const trendChartData = Object.keys(trendMap).map(key => ({
                month: key,
                incidents: trendMap[key]
            }));
            setIncidentTrend(trendChartData);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ නිවැරදි කළ PDF Generate Function එක
    const generatePDF = () => {
        const doc = new jsPDF();
        const date = new Date().toLocaleDateString();
        const monthName = new Date().toLocaleString('default', { month: 'long' });

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("SafetyFirst Monthly Report", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text(`Generated on: ${date}`, 14, 28);
        doc.text(`Reporting Period: ${monthName} ${new Date().getFullYear()}`, 14, 34);

        doc.setLineWidth(0.5);
        doc.line(14, 38, 196, 38);

        // KPI Summary
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text("Executive Summary", 14, 50);

        const kpiData = [
            ['Total Incidents (This Month)', kpis.totalIncidents],
            ['Open Hazards', kpis.openHazards],
            ['Inspections Completed', kpis.completedInspections],
            ['Safe Man Hours estimated', kpis.safeManHours.toLocaleString()]
        ];

        // 🔥 FIX 1: autoTable(doc, ...) භාවිතා කිරීම
        autoTable(doc, {
            startY: 55,
            head: [['Metric', 'Value']],
            body: kpiData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] }
        });

        // Incidents Table
        // 🔥 FIX 2: doc.lastAutoTable?.finalY ආරක්ෂිතව ලබා ගැනීම
        let currentY = (doc.lastAutoTable?.finalY || 60) + 20;

        doc.text("Incident Log (Recent)", 14, currentY);

        const incidentRows = incidentsList.slice(0, 15).map(inc => [
            new Date(inc.created_at).toLocaleDateString(),
            inc.title,
            inc.type || 'General',
            inc.severity,
            inc.status || 'Open'
        ]);

        // 🔥 FIX 3: මෙතනත් autoTable(doc, ...) භාවිතා කිරීම
        autoTable(doc, {
            startY: currentY + 5,
            head: [['Date', 'Title', 'Type', 'Severity', 'Status']],
            body: incidentRows,
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38] } // Red header for incidents
        });

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text('Generated by OHS Admin System', 14, doc.internal.pageSize.height - 10);
            doc.text(`Page ${i} of ${pageCount}`, 190, doc.internal.pageSize.height - 10, { align: 'right' });
        }

        doc.save(`OHS_Report_${monthName}_${new Date().getFullYear()}.pdf`);
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8 space-y-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
                            <p className="text-sm text-gray-500 mt-1">Real-time safety insights and reporting.</p>
                        </div>
                        <button
                            onClick={generatePDF}
                            className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition shadow-sm font-medium"
                        >
                            <FileText className="w-5 h-5 mr-2" />
                            Download Monthly Report (PDF)
                        </button>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KPICard title="Total Incidents (Mo)" value={kpis.totalIncidents} icon={AlertTriangle} color="bg-red-50 text-red-600" />
                        <KPICard title="Open Hazards" value={kpis.openHazards} icon={Activity} color="bg-orange-50 text-orange-600" />
                        <KPICard title="Inspections Done" value={kpis.completedInspections} icon={CheckCircle} color="bg-green-50 text-green-600" />
                        <KPICard title="Safe Man Hours" value={kpis.safeManHours.toLocaleString()} icon={Clock} color="bg-blue-50 text-blue-600" />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Incidents Trend */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800 mb-6">Incident Trend (6 Months)</h2>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={incidentTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} dy={10} fontSize={12} />
                                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="incidents" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Incidents by Severity */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800 mb-6">Incidents by Severity</h2>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={severityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {severityData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Hazard Status */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-800 mb-6">Hazard Resolution Status</h2>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={hazardStatusData}
                                            cx="50%" cy="50%"
                                            innerRadius={60} outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {hazardStatusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS_STATUS[index % COLORS_STATUS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Static Placeholder for Report Archive */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center">
                            <div className="p-4 bg-gray-100 rounded-full mb-4">
                                <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Previous Reports</h3>
                            <p className="text-sm text-gray-500 mb-6">Access archived monthly safety reports.</p>
                            <button className="px-4 py-2 text-primary-600 font-medium hover:bg-primary-50 rounded-lg transition">
                                View Archive
                            </button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

// Helper Component for KPI Cards
const KPICard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
        <div className={`p-4 rounded-xl ${color} mr-4`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    </div>
);

export default Analytics;