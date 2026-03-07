import React, { useState } from 'react';
import { X, Calendar, MapPin, UploadCloud, AlertTriangle, AlertCircle, ShieldAlert, Zap, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const CreateIncident = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [incidentType, setIncidentType] = useState(null);
    const [severity, setSeverity] = useState('low');
    const [date, setDate] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState(null);

    const types = [
        { id: 'injury', label: 'Injury', icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
        { id: 'near-miss', label: 'Near Miss', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
        { id: 'hazard', label: 'Hazard', icon: ShieldAlert, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'property', label: 'Property Damage', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    ];

    const handleImageUpload = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await supabase.storage
                .from('incident-evidence')
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('incident-evidence')
                .getPublicUrl(filePath);

            setEvidenceUrl(publicUrl);
            alert('Image uploaded successfully!');
        } catch (error) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!incidentType || !date || !location || !description) {
            alert('Please fill in all required fields.');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('incidents')
                .insert([
                    {
                        type: incidentType,
                        occurred_at: date,
                        location: location,
                        description: description,
                        severity: severity,
                        evidence_url: evidenceUrl,
                        status: 'Open' // Default status
                    }
                ]);

            if (error) throw error;

            alert('Incident reported successfully!');
            navigate('/');
        } catch (error) {
            alert('Error submitting report: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-12">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 sticky top-0 z-10">
                <h1 className="text-xl font-bold text-slate-800">Report a Safety Incident</h1>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                    <X className="w-5 h-5 mr-1" />
                    Cancel
                </button>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto mt-8 px-4">

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-8 space-y-10">

                        {/* 1. Select Type */}
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Select Incident Type <span className="text-red-500">*</span></h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {types.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => setIncidentType(type.id)}
                                        className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${incidentType === type.id
                                                ? `border-primary-500 bg-primary-50`
                                                : `border-gray-100 hover:border-gray-200 hover:bg-gray-50`
                                            }`}
                                    >
                                        <div className={`p-3 rounded-full mb-3 ${type.bg}`}>
                                            <type.icon className={`w-8 h-8 ${type.color}`} />
                                        </div>
                                        <span className={`font-semibold ${incidentType === type.id ? 'text-primary-700' : 'text-gray-700'}`}>
                                            {type.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 2. Basic Details */}
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date & Time <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 outline-none transition-shadow"
                                        />
                                        <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 bg-white appearance-none outline-none transition-shadow"
                                        >
                                            <option value="">Select Location...</option>
                                            <option value="Plant A">Plant A</option>
                                            <option value="Warehouse B">Warehouse B</option>
                                            <option value="Head Office">Head Office</option>
                                            <option value="Logistics Center">Logistics Center</option>
                                        </select>
                                        <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Description */}
                        <section>
                            <label className="block text-lg font-bold text-gray-900 mb-4">Description <span className="text-red-500">*</span></label>
                            <textarea
                                rows="5"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="block w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 outline-none transition-shadow"
                                placeholder="Describe what happened, who was involved, and the immediate actions taken..."
                            ></textarea>
                        </section>

                        {/* 4. Evidence */}
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Evidence</h2>
                            <label className={`block border-2 border-dashed ${evidenceUrl ? 'border-primary-500 bg-primary-50' : 'border-gray-300'} rounded-xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer group relative`}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />

                                {uploading ? (
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-3"></div>
                                        <p className="text-sm font-medium text-gray-900">Uploading...</p>
                                    </div>
                                ) : evidenceUrl ? (
                                    <div className="flex flex-col items-center">
                                        <div className="p-4 bg-white rounded-full inline-flex mb-4 shadow-sm">
                                            <Check className="w-8 h-8 text-primary-600" />
                                        </div>
                                        <h3 className="text-lg font-medium text-primary-700">Image Attached Successfully</h3>
                                        <p className="text-sm text-gray-500 mt-2">Click to replace</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="p-4 bg-gray-50 rounded-full inline-flex mb-4 group-hover:bg-white transition-colors">
                                            <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-primary-500 transition-colors" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Click to upload or drag and drop</h3>
                                        <p className="text-sm text-gray-500 mt-2">Photos, Videos, or Documents (Max 10MB)</p>
                                    </div>
                                )}
                            </label>
                        </section>

                        {/* 5. Severity (Segmented Control) */}
                        <section>
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Severity Level</h2>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {['Low', 'Medium', 'High', 'Critical'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setSeverity(level.toLowerCase())}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${severity === level.toLowerCase()
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`px-8 py-3 bg-primary-600 text-white font-bold rounded-lg shadow-sm hover:bg-primary-700 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default CreateIncident;
