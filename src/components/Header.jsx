import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, User as UserIcon, Settings } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        full_name: '',
        role: '',
        avatar_url: null,
        job_title: ''
    });
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const fetchHeaderData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileData) {
                    setProfile({
                        full_name: profileData.full_name || user.email.split('@')[0],
                        role: profileData.role,
                        avatar_url: profileData.avatar_url,
                        job_title: profileData.job_title
                    });
                }

                // Fetch Recent Open Incidents (Notifications)
                const { data: incidents, error } = await supabase
                    .from('incidents')
                    .select('id, title, created_at, type')
                    .eq('status', 'Open')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (incidents) {
                    setNotifications(incidents);
                }
            }
        } catch (error) {
            console.error('Error fetching header data:', error);
        }
    };

    useEffect(() => {
        fetchHeaderData();

        // Listen for local profile updates (from Settings page)
        const handleProfileUpdate = () => {
            fetchHeaderData();
        };

        window.addEventListener('profile-updated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 ml-64">
            {/* Search Bar */}
            <div className="flex-1 max-w-lg">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition duration-150 ease-in-out"
                        placeholder="Search incidents, users, or settings..."
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                        <span className="sr-only">Notifications</span>
                        <Bell className="h-6 w-6" />
                        {notifications.length > 0 && (
                            <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20 animate-in fade-in zoom-in-95 duration-100">
                            <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                <span className="text-xs text-gray-500">{notifications.length} New</span>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map((notification) => (
                                        <button
                                            key={notification.id}
                                            onClick={() => {
                                                navigate('/actions'); // Pending implementation of incident detail view, send to Actions or similar
                                                setShowNotifications(false);
                                            }}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                                        >
                                            <p className="text-sm font-medium text-gray-900 truncate">{notification.title || `Please Check Incident: ${notification.type}`}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {new Date(notification.created_at).toLocaleDateString()} • {notification.type}
                                            </p>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                        No new notifications
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={() => navigate('/report-incident')}
                                    className="text-xs font-medium text-primary-600 hover:text-primary-800 w-full text-center"
                                >
                                    View All Incidents
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-8 w-px bg-gray-200 mx-2"></div>

                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center cursor-pointer focus:outline-none"
                    >
                        <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm overflow-hidden border border-gray-200">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                <span>{profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}</span>
                            )}
                        </div>
                        <div className="ml-3 hidden md:block text-left">
                            <p className="text-sm font-medium text-gray-700">{profile.full_name || 'User'}</p>
                            <p className="text-xs text-gray-500">
                                {profile.job_title || profile.role?.replace('_', ' ').toUpperCase() || 'MEMBER'}
                            </p>
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-20 animate-in fade-in zoom-in-95 duration-100">
                            <button
                                onClick={() => navigate('/settings')}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
