import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import {
    AlertTriangle, Plus, Filter, MapPin, Camera,
    CheckCircle, X, AlertOctagon, CheckSquare
} from 'lucide-react';

const Hazards = () => {
    const [hazards, setHazards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All'); // All, Open, Resolved
    const [filterRisk, setFilterRisk] = useState('All'); // All, Low, Medium, High, Critical

    // Modal States
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [selectedHazard, setSelectedHazard] = useState(null);

    // Form States
    const [newHazard, setNewHazard] = useState({
        title: '',
        description: '',
        risk_level: 'Low',
        location: '',
        image_url: '' // Placeholder for now
    });
    const [resolutionNote, setResolutionNote] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchHazards();
    }, []);

    const fetchHazards = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Get Company ID first (to filter by company)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.company_id) {
                    let query = supabase
                        .from('hazards')
                        .select('*')
                        .eq('company_id', profile.company_id)
                        .order('created_at', { ascending: false });

                    const { data, error } = await query;
                    if (error) throw error;
                    setHazards(data);
                }
            }
        } catch (error) {
            console.error('Error fetching hazards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReportSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();

            const payload = {
                ...newHazard,
                company_id: profile.company_id,
                created_by: user.id,
                status: 'Open'
            };

            const { error } = await supabase.from('hazards').insert(payload);
            if (error) throw error;

            setIsReportModalOpen(false);
            setNewHazard({ title: '', description: '', risk_level: 'Low', location: '', image_url: '' });
            fetchHazards(); // Refresh list
            alert('Hazard reported successfully.');
        } catch (error) {
            console.error('Error reporting hazard:', error);
            alert('Failed to report hazard.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResolveSubmit = async () => {
        if (!resolutionNote.trim()) return alert('Please enter mitigation action.');
        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('hazards')
                .update({
                    status: 'Resolved',
                    resolution_notes: resolutionNote,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', selectedHazard.id);

            if (error) throw error;

            setIsResolveModalOpen(false);
            setResolutionNote('');
            setSelectedHazard(null);
            fetchHazards();
        } catch (error) {
            console.error('Error resolving hazard:', error);
            alert('Failed to resolve hazard.');
        } finally {
            setSubmitting(false);
        }
    };

    const openResolveModal = (hazard) => {
        setSelectedHazard(hazard);
        setIsResolveModalOpen(true);
    };

    // Filtering Logic
    const filteredHazards = hazards.filter(h => {
        if (filterStatus !== 'All' && h.status !== filterStatus) return false;
        if (filterRisk !== 'All' && h.risk_level !== filterRisk) return false;
        return true;
    });

    const getRiskColor = (level) => {
        switch (level) {
            case 'Low': return 'bg-green-100 text-green-800 border-green-200';
            case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'High': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Critical': return 'bg-red-100 text-red-800 border-red-200 font-bold';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8">
                    <div className="max-w-7xl mx-auto">

                        {/* Header */}
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                    <AlertTriangle className="w-6 h-6 mr-2 text-primary-600" />
                                    Hazard Registry
                                </h1>
                                <p className="text-gray-500 mt-1">Track and manage workplace safety hazards.</p>
                            </div>
                            <button
                                onClick={() => setIsReportModalOpen(true)}
                                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Report Hazard
                            </button>
                        </div>

                        {/* Filters */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
                            <div className="flex items-center text-gray-500 mr-2">
                                <Filter className="w-4 h-4 mr-2" />
                                <span className="text-sm font-medium">Filters:</span>
                            </div>

                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                            >
                                <option value="All">All Status</option>
                                <option value="Open">Open</option>
                                <option value="Resolved">Resolved</option>
                            </select>

                            <select
                                value={filterRisk}
                                onChange={(e) => setFilterRisk(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary-500"
                            >
                                <option value="All">All Risks</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                                <option value="Critical">Critical</option>
                            </select>
                        </div>

                        {/* Hazards List */}
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">Loading hazards...</div>
                        ) : filteredHazards.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                                <AlertOctagon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No hazards found matching your filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredHazards.map(hazard => (
                                    <div key={hazard.id} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition-shadow">

                                        {/* Status Bar */}
                                        <div className={`h-2 rounded-t-xl ${hazard.status === 'Resolved' ? 'bg-green-500' : 'bg-red-500'}`} />

                                        <div className="p-5 flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getRiskColor(hazard.risk_level)}`}>
                                                    {hazard.risk_level}
                                                </span>
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${hazard.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                                    {hazard.status}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-gray-900 mb-2 text-lg">{hazard.title}</h3>
                                            <p className="text-gray-600 text-sm mb-4 line-clamp-3">{hazard.description}</p>

                                            <div className="flex items-center text-gray-500 text-xs mb-4">
                                                <MapPin className="w-3 h-3 mr-1" />
                                                {hazard.location || 'No Location'}
                                                <span className="mx-2">•</span>
                                                {new Date(hazard.created_at).toLocaleDateString()}
                                            </div>

                                            {hazard.resolution_notes && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs text-gray-600">
                                                    <span className="font-semibold block mb-1">Resolution:</span>
                                                    {hazard.resolution_notes}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Footer */}
                                        {hazard.status === 'Open' && (
                                            <div className="p-4 border-t border-gray-100 mt-auto">
                                                <button
                                                    onClick={() => openResolveModal(hazard)}
                                                    className="w-full flex items-center justify-center px-4 py-2 bg-white border border-green-600 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
                                                >
                                                    <CheckSquare className="w-4 h-4 mr-2" />
                                                    Mark Resolved
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* REPORT MODAL */}
            {isReportModalOpen && (
                <div className="fixed inset-0 bg-black/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Report New Hazard</h3>
                            <button onClick={() => setIsReportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleReportSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hazard Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newHazard.title}
                                    onChange={(e) => setNewHazard({ ...newHazard, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    placeholder="e.g. Exposed Wiring"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                <select
                                    value={newHazard.location}
                                    onChange={(e) => setNewHazard({ ...newHazard, location: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                >
                                    <option value="">Select Location</option>
                                    <option value="Warehouse A">Warehouse A</option>
                                    <option value="Production Line">Production Line</option>
                                    <option value="Office Block">Office Block</option>
                                    <option value="Cafeteria">Cafeteria</option>
                                    <option value="Loading Dock">Loading Dock</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                                    <select
                                        value={newHazard.risk_level}
                                        onChange={(e) => setNewHazard({ ...newHazard, risk_level: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button type="button" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center justify-center">
                                        <Camera className="w-4 h-4 mr-2" />
                                        Upload Photo
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    value={newHazard.description}
                                    onChange={(e) => setNewHazard({ ...newHazard, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                    placeholder="Describe the hazard details..."
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition disabled:opacity-70"
                            >
                                {submitting ? 'Reporting...' : 'Submit Report'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* RESOLVE MODAL */}
            {isResolveModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Resolve Hazard</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">What action did you take to mitigate this hazard?</p>
                            <textarea
                                rows={4}
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                placeholder="e.g. Repaired the wiring and installed a safety cover."
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsResolveModalOpen(false)}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResolveSubmit}
                                    disabled={submitting}
                                    className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-70"
                                >
                                    {submitting ? 'Saving...' : 'Mark Resolved'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Hazards;
