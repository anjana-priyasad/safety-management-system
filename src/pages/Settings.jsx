import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    User,
    Building,
    Lock,
    Activity,
    Camera,
    Shield,
    Mail,
    Save,
    CreditCard,
    Users,
    Loader2,
    CheckCircle,
    XCircle,
    FileText,
    AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

const Toast = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 mb-4 rounded-lg shadow-lg transition-all transform translate-y-0 ${type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {type === 'success' ? <CheckCircle className="w-5 h-5 mr-2" /> : <XCircle className="w-5 h-5 mr-2" />}
            <div className="text-sm font-medium">{message}</div>
        </div>
    );
};

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({
        full_name: '',
        role: '',
        email: '',
        avatar_url: null,
        job_title: '',
        company_id: null
    });

    // Activity Data
    const [activities, setActivities] = useState({
        incidents: [],
        inspections: []
    });
    const [activityLoading, setActivityLoading] = useState(false);

    // Company Data
    const [company, setCompany] = useState({
        name: '',
        subscription_plan: ''
    });
    const [memberCount, setMemberCount] = useState(0);

    // Password State
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [activeTab, setActiveTab] = useState('profile');
    const [toast, setToast] = useState(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivity();
        }
    }, [activeTab, user]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            setUser(user);

            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;

            setProfile({
                ...profileData,
                email: user.email,
                job_title: profileData.job_title || '' // Handle if column logic needs fallbacks
            });

            // If admin, fetch company details (Existing Logic)
            if (profileData.role === 'admin' && profileData.company_id) {
                const { data: companyData, error: companyError } = await supabase
                    .from('companies')
                    .select('*')
                    .eq('id', profileData.company_id)
                    .single();

                if (!companyError && companyData) {
                    setCompany(companyData);
                }

                const { count, error: countError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('company_id', profileData.company_id);

                if (!countError) {
                    setMemberCount(count);
                }
            }

        } catch (error) {
            console.error('Error fetching settings:', error);
            setToast({ type: 'error', message: 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    };

    const fetchActivity = async () => {
        if (!user) return;

        try {
            setActivityLoading(true);

            // Fetch Incidents (Reported by user)
            const { data: incidents, error: incidentError } = await supabase
                .from('incidents')
                .select('*')
                .eq('reported_by', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (incidentError) throw incidentError;

            // Fetch Inspections (Conducted by user)
            // Note: Using inspection_submissions table based on previous file analysis
            const { data: inspections, error: inspectionError } = await supabase
                .from('inspection_submissions')
                .select('*, inspection_templates(title)')
                .eq('inspector_id', user.id)
                .order('submitted_at', { ascending: false })
                .limit(5);

            if (inspectionError) throw inspectionError;

            setActivities({
                incidents: incidents || [],
                inspections: inspections || []
            });

        } catch (error) {
            console.error('Error fetching activity:', error);
            setToast({ type: 'error', message: 'Failed to load activity history.' });
        } finally {
            setActivityLoading(false);
        }
    };

    const handleAvatarUpload = async (event) => {
        try {
            setUploadingAvatar(true);
            const file = event.target.files[0];
            if (!file) return;

            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
            setToast({ type: 'success', message: 'Profile picture updated!' });

        } catch (error) {
            console.error('Error uploading avatar:', error);
            setToast({ type: 'error', message: 'Failed to upload image.' });
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleUpdateProfile = async () => {
        try {
            setSaving(true);
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    // If job_title column exists, update it. 
                    // Assuming user prerequisite implies column might be added or we just handle it in UI state if strictly needed as per instructions.
                    // Instructions say: "add this column to profile update logic if strictly needed, or just store in local state for now".
                    // I'll try to update it, if it fails Supabase will error, but let's assume valid column if requested.
                    // To be safe against schema errors if column missing, I'll explicitly only update 'full_name' if job_title isn't in db schema, 
                    // but the user's prompt implies effectively "implement this feature". I'll add it to the update payload.
                    job_title: profile.job_title
                })
                .eq('id', user.id);

            if (error) {
                // Fallback if job_title column doesn't exist yet to prevent total failure
                if (error.message.includes('job_title')) {
                    await supabase
                        .from('profiles')
                        .update({ full_name: profile.full_name })
                        .eq('id', user.id);
                    setToast({ type: 'success', message: 'Profile updated (Job Title skipped - column missing).' });
                } else {
                    throw error;
                }
            } else {
                setToast({ type: 'success', message: 'Profile details updated successfully!' });
            }

            // Notify Header to update immediately
            window.dispatchEvent(new CustomEvent('profile-updated'));

        } catch (error) {
            console.error('Error updating profile:', error);
            setToast({ type: 'error', message: 'Failed to update profile.' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setToast({ type: 'error', message: 'Passwords do not match.' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setToast({ type: 'error', message: 'Password must be at least 6 characters.' });
            return;
        }

        try {
            setSaving(true);
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            setToast({ type: 'success', message: 'Password updated successfully!' });
            setPasswordData({ newPassword: '', confirmPassword: '' });

        } catch (error) {
            console.error('Error updating password:', error);
            setToast({ type: 'error', message: error.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8">
                    <div className="max-w-5xl mx-auto space-y-8">

                        {/* Title Section */}
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Account Settings</h1>
                            <p className="text-gray-500 mt-2">Manage your personal profile, security, and company preferences.</p>
                        </div>

                        {toast && (
                            <Toast
                                message={toast.message}
                                type={toast.type}
                                onClose={() => setToast(null)}
                            />
                        )}

                        <div className="flex flex-col lg:flex-row gap-8">

                            {/* Navigation Tabs */}
                            <nav className="w-full lg:w-64 flex-shrink-0 space-y-1">
                                {[
                                    { id: 'profile', icon: User, label: 'My Profile' },
                                    { id: 'activity', icon: Activity, label: 'My Activity' },
                                    { id: 'security', icon: Lock, label: 'Security' },
                                    ...(profile.role === 'admin' ? [{ id: 'company', icon: Building, label: 'Company' }] : [])
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === item.id
                                            ? 'bg-white text-primary-600 shadow-md ring-1 ring-black/5'
                                            : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                                            }`}
                                    >
                                        <item.icon className={`mr-3 h-5 w-5 ${activeTab === item.id ? 'text-primary-600' : 'text-gray-400'}`} />
                                        {item.label}
                                    </button>
                                ))}
                            </nav>

                            {/* Main Content Area */}
                            <div className="flex-1">
                                <div className="bg-white shadow rounded-2xl ring-1 ring-black/5 overflow-hidden min-h-[500px]">

                                    {/* Tab 1: My Profile */}
                                    {activeTab === 'profile' && (
                                        <div className="p-8 space-y-8">
                                            {/* Avatar Section */}
                                            <div className="flex items-center space-x-6 pb-8 border-b border-gray-100">
                                                <div className="relative group">
                                                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 ring-4 ring-white shadow-lg">
                                                        {profile.avatar_url ? (
                                                            <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-primary-600 font-bold text-3xl bg-primary-50">
                                                                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                                                            </div>
                                                        )}
                                                        {uploadingAvatar && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md border border-gray-200 hover:border-primary-500 hover:text-primary-600 transition-colors"
                                                        title="Upload new photo"
                                                    >
                                                        <Camera className="w-4 h-4" />
                                                    </button>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleAvatarUpload}
                                                    />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900">{profile.full_name || 'User'}</h2>
                                                    <p className="text-sm text-gray-500">{profile.email}</p>
                                                    <div className="mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block uppercase tracking-wide font-semibold">
                                                        {profile.role?.replace('_', ' ') || 'Member'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Form Fields */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={profile.full_name}
                                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Job Title</label>
                                                    <div className="relative">
                                                        <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={profile.job_title}
                                                            onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                                            placeholder="e.g. Safety Officer"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                        <input
                                                            type="email"
                                                            value={profile.email}
                                                            disabled
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-400">Email address is managed by your administrator.</p>
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t border-gray-100 flex justify-end">
                                                <button
                                                    onClick={handleUpdateProfile}
                                                    disabled={saving}
                                                    className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-sm disabled:opacity-50"
                                                >
                                                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                                    {saving ? 'Saving...' : 'Save Changes'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 2: My Activity */}
                                    {activeTab === 'activity' && (
                                        <div className="p-8 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                                                <div className="text-sm text-gray-500">Your latest contributions</div>
                                            </div>

                                            {activityLoading ? (
                                                <div className="py-12 flex justify-center">
                                                    <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                                                </div>
                                            ) : (
                                                <div className="space-y-8">
                                                    {/* Reports */}
                                                    <div>
                                                        <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center">
                                                            <AlertTriangle className="w-4 h-4 mr-2" /> Recent Incident Reports
                                                        </h4>
                                                        {activities.incidents.length > 0 ? (
                                                            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                                                {activities.incidents.map((incident) => (
                                                                    <div key={incident.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="font-medium text-gray-900">{incident.title || 'Untitled Incident'}</p>
                                                                                <p className="text-xs text-gray-500 mt-1">{new Date(incident.created_at).toLocaleDateString()}</p>
                                                                            </div>
                                                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${incident.status === 'Open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                                                }`}>
                                                                                {incident.status || 'Reported'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic">No incidents reported recently.</p>
                                                        )}
                                                    </div>

                                                    {/* Inspections */}
                                                    <div>
                                                        <h4 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3 flex items-center">
                                                            <FileText className="w-4 h-4 mr-2" /> Inspections Conducted
                                                        </h4>
                                                        {activities.inspections.length > 0 ? (
                                                            <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                                                {activities.inspections.map((inspection) => (
                                                                    <div key={inspection.id} className="p-4 border-b border-gray-100 last:border-0 hover:bg-white transition-colors">
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="font-medium text-gray-900">{inspection.inspection_templates?.title || 'Unknown Inspection'}</p>
                                                                                <p className="text-xs text-gray-500 mt-1">{new Date(inspection.submitted_at).toLocaleDateString()}</p>
                                                                            </div>
                                                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${inspection.status === 'Safe' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                                                }`}>
                                                                                {inspection.status || 'Completed'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-gray-500 italic">No inspections conducted recently.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab 3: Security */}
                                    {activeTab === 'security' && (
                                        <div className="p-8 space-y-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Security Settings</h3>
                                                <p className="text-sm text-gray-500">Update your password and security preferences.</p>
                                            </div>

                                            <div className="max-w-md space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">New Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                        <input
                                                            type="password"
                                                            value={passwordData.newPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                        <input
                                                            type="password"
                                                            value={passwordData.confirmPassword}
                                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="pt-4">
                                                    <button
                                                        onClick={handleUpdatePassword}
                                                        disabled={saving}
                                                        className="w-full flex items-center justify-center px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
                                                    >
                                                        {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Shield className="w-5 h-5 mr-2" />}
                                                        Update Password
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tab 4: Company (Admin Only) */}
                                    {activeTab === 'company' && (
                                        <div className="p-8 space-y-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Company Profile</h3>
                                                <p className="text-sm text-gray-500">Manage organization details and branding.</p>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Logo Placeholder */}
                                                <div className="col-span-1">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                                                    <div className="h-40 w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 transition cursor-pointer">
                                                        <Camera className="w-8 h-8 mb-2" />
                                                        <span className="text-sm">Click to upload logo</span>
                                                    </div>
                                                </div>

                                                {/* Company Details */}
                                                <div className="space-y-4 col-span-1">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Company Name</label>
                                                        <div className="relative">
                                                            <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={company.name || ''}
                                                                disabled
                                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">Plan</label>
                                                        <div className="relative">
                                                            <CreditCard className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                                            <input
                                                                type="text"
                                                                value={company.subscription_plan || 'Free Plan'}
                                                                disabled
                                                                className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg cursor-not-allowed"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Member Stats Card */}
                                                <div className="col-span-1 md:col-span-2">
                                                    <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                        <div className="p-3 rounded-full bg-white text-blue-600 shadow-sm mr-4">
                                                            <Users className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
                                                            <p className="text-sm text-blue-600 font-medium">Active Team Members</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Settings;
