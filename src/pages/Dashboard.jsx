import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import KPICard from '../components/KPICard';
import IncidentsChart from '../components/IncidentsChart';
import RecentActivities from '../components/RecentActivities';
import DashboardButtons from '../components/DashboardButtons';
import { AlertTriangle, CheckCircle, ShieldAlert, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalIncidents: 0,
        openHazards: 5, // Placeholder for now
        pendingInspections: 2, // Placeholder
        safeHours: 1250 // Placeholder
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Total Incidents
                const { count, error } = await supabase
                    .from('incidents')
                    .select('*', { count: 'exact', head: true });

                if (error) throw error;

                setStats(prev => ({
                    ...prev,
                    totalIncidents: count || 0
                }));
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const kpiData = [
        {
            title: 'Total Incidents',
            value: loading ? '...' : stats.totalIncidents,
            trend: '+2 vs last month',
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-100',
            trendColor: 'text-red-600'
        },
        {
            title: 'Open Hazards',
            value: stats.openHazards,
            trend: '-1 vs last month',
            icon: ShieldAlert,
            color: 'text-orange-600',
            bg: 'bg-orange-100',
            trendColor: 'text-green-600'
        },
        {
            title: 'Pending Inspections',
            value: stats.pendingInspections,
            trend: '0 vs last month',
            icon: CheckCircle,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            trendColor: 'text-gray-600'
        },
        {
            title: 'Safe Man Hours',
            value: stats.safeHours.toLocaleString(),
            trend: '+150 vs last month',
            icon: Clock,
            color: 'text-green-600',
            bg: 'bg-green-100',
            trendColor: 'text-green-600'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8">
                    <div className="max-w-7xl mx-auto space-y-6">

                        {/* Page Title */}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-sm text-gray-500">Overview of your safety performance</p>
                        </div>

                        {/* KPI Cards Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {kpiData.map((kpi, index) => (
                                <KPICard
                                    key={index}
                                    title={kpi.title}
                                    value={kpi.value}
                                    icon={kpi.icon}
                                    trend={kpi.trend}
                                // trendDown calculation logic or prop if needed, mostly handled by component
                                />
                            ))}
                        </div>

                        {/* Middle Section: Chart + Activities */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <IncidentsChart />
                            </div>
                            <div>
                                <RecentActivities />
                            </div>
                        </div>

                        {/* Action Area */}
                        <div>
                            <DashboardButtons />
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
