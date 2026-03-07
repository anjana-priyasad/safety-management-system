import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { Plus, Trash2, Shield, User, Mail, MoreVertical, X, CheckCircle } from 'lucide-react';

const Team = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);

    // Invite Form
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('employee');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            // RLS will ensure we only see users in our company (if we are admin)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMembers(data);
        } catch (error) {
            console.error('Error fetching team:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setInviteLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase.functions.invoke('invite-user', {
                body: { email: inviteEmail, role: inviteRole }
            });

            if (error) throw error;

            setMessage({ type: 'success', text: `Invitation sent to ${inviteEmail}` });
            setInviteEmail('');
            setInviteRole('employee');
            fetchTeam();

            setTimeout(() => {
                setShowInviteModal(false);
                setMessage(null);
            }, 2000);

        } catch (error) {
            console.error('Invite error:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to send invitation' });
        } finally {
            setInviteLoading(false);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;
            setMembers(members.filter(m => m.id !== userId));
        } catch (error) {
            alert('Error deleting user: ' + error.message);
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>;
            case 'safety_officer': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Safety Officer</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Employee</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans flex text-gray-900">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
                                <p className="text-gray-500 text-sm mt-1">Manage users and access rights for your company.</p>
                            </div>
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Member
                            </button>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center py-8">Loading team...</td></tr>
                                    ) : members.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center py-8">No team members found.</td></tr>
                                    ) : (
                                        members.map((member) => (
                                            <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold overflow-hidden mr-3">
                                                            {member.avatar_url ? (
                                                                <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                                                            ) : (
                                                                <User className="w-5 h-5" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-gray-900">{member.full_name || 'Unnamed User'}</div>
                                                            <div className="text-sm text-gray-500">{member.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getRoleBadge(member.role)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {member.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(member.id)}
                                                        className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </main>
            </div>

            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Invite New Member</h3>
                            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleInvite} className="p-6 space-y-4">
                            {message && (
                                <div className={`p-3 rounded-lg text-sm flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {message.type === 'success' ? <CheckCircle className="w-4 h-4 mr-2 mt-0.5" /> : <Shield className="w-4 h-4 mr-2 mt-0.5" />}
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    placeholder="colleague@company.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                                >
                                    <option value="employee">Employee (Report Only)</option>
                                    <option value="safety_officer">Safety Officer (Inspections)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className={`w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm ${inviteLoading ? 'opacity-70' : ''}`}
                                >
                                    {inviteLoading ? 'Inviting...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Team;
