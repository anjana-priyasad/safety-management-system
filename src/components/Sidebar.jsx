import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    AlertTriangle,
    ShieldAlert,
    ClipboardCheck,
    BarChart2,
    Users,
    Settings,
    MessageCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUserRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    if (data && data.role === 'admin') {
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                    }
                }
            } catch (error) {
                console.error('Error checking role:', error.message);
            } finally {
                setLoading(false);
            }
        };
        checkUserRole();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: AlertTriangle, label: 'Incidents', path: '/report-incident' },
        { icon: ShieldAlert, label: 'Hazards', path: '/hazards' },
        { icon: ClipboardCheck, label: 'Inspections', path: '/inspections' },
        { icon: ClipboardCheck, label: 'Action Tracker', path: '/actions' },
        { icon: BarChart2, label: 'Analytics', path: '/analytics' },
        // Team Management පෙන්වන්නේ Admin ට විතරයි
        ...(isAdmin ? [{ icon: Users, label: 'Team Management', path: '/team' }] : []),
        { icon: MessageCircle, label: 'Messages', path: '/messages' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path) && path !== '#';
    };

    return (
        <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0 z-10">
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
                <span className="text-xl font-bold text-primary-600">OHS Admin</span>
            </div>

            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {menuItems.map((item, index) => {
                        const active = isActive(item.path);
                        return (
                            <li key={index}>
                                <button
                                    onClick={() => item.path !== '#' && navigate(item.path)}
                                    className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${active
                                        ? 'text-primary-600 bg-primary-50 border-r-4 border-primary-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        } ${item.path === '#' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <item.icon className={`w-5 h-5 mr-3 ${active ? 'text-primary-600' : 'text-gray-400'}`} />
                                    {item.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors mb-2"
                >
                    <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                </button>
                <div className="flex items-center text-sm text-gray-400 px-4">
                    <span>&copy; 2026 wikendy digital.</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;