import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Plus, Trash2, Save, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TemplateBuilder = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Template Details
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [scheduleType, setScheduleType] = useState('recurring');
    const [recurrence, setRecurrence] = useState('daily');
    const [customInterval, setCustomInterval] = useState('');
    const [questions, setQuestions] = useState([
        { id: Date.now(), text: '', type: 'pass_fail' }
    ]);

    const addQuestion = () => {
        setQuestions([
            ...questions,
            { id: Date.now(), text: '', type: 'pass_fail' }
        ]);
    };

    const removeQuestion = (id) => {
        if (questions.length === 1) return;
        setQuestions(questions.filter(q => q.id !== id));
    };

    const updateQuestion = (id, field, value) => {
        setQuestions(questions.map(q =>
            q.id === id ? { ...q, [field]: value } : q
        ));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setMessage({ type: 'error', text: 'Template title is required.' });
            return;
        }

        // Validate custom interval
        if (scheduleType === 'recurring' && recurrence === 'custom' && (!customInterval || customInterval < 1)) {
            setMessage({ type: 'error', text: 'Please enter a valid number of days for custom interval.' });
            return;
        }

        // validate questions
        const invalidQuestions = questions.some(q => !q.text.trim());
        if (invalidQuestions) {
            setMessage({ type: 'error', text: 'All questions must have text.' });
            return;
        }

        setLoading(true);
        setMessage(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Get Company ID
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            if (!profile?.company_id) throw new Error('Company ID not found for user.');

            const templateData = {
                company_id: profile.company_id,
                title,
                description,
                questions: questions,
                created_by: user.id,
                schedule_type: scheduleType,
                recurrence: scheduleType === 'recurring' ? recurrence : null,
                custom_interval: (scheduleType === 'recurring' && recurrence === 'custom') ? parseInt(customInterval) : null
            };

            const { error } = await supabase
                .from('inspection_templates')
                .insert(templateData);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Template saved successfully!' });
            setTimeout(() => navigate('/inspections'), 1500);

        } catch (error) {
            console.error('Error saving template:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to save template.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8">
                    <div className="max-w-4xl mx-auto">
                        <button
                            onClick={() => navigate('/inspections')}
                            className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Inspections
                        </button>

                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">Create New Inspection Template</h1>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium disabled:opacity-70"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Saving...' : 'Save Template'}
                            </button>
                        </div>

                        {message && (
                            <div className={`mb-6 p-4 rounded-lg flex items-start ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {message.type === 'success' ? <CheckCircle className="w-5 h-5 mr-2 mt-0.5" /> : <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />}
                                {message.text}
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        placeholder="e.g. Forklift Daily Check"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                        placeholder="Brief details about when to use this inspection..."
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Schedule Type</label>
                                        <div className="flex gap-4">
                                            <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${scheduleType === 'recurring' ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="scheduleType"
                                                    value="recurring"
                                                    checked={scheduleType === 'recurring'}
                                                    onChange={(e) => setScheduleType(e.target.value)}
                                                    className="hidden"
                                                />
                                                Recurring (Routine)
                                            </label>
                                            <label className={`flex-1 flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-all ${scheduleType === 'one_time' ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                                <input
                                                    type="radio"
                                                    name="scheduleType"
                                                    value="one_time"
                                                    checked={scheduleType === 'one_time'}
                                                    onChange={(e) => setScheduleType(e.target.value)}
                                                    className="hidden"
                                                />
                                                One-Time Task
                                            </label>
                                        </div>
                                    </div>

                                    {scheduleType === 'recurring' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                                                <select
                                                    value={recurrence}
                                                    onChange={(e) => setRecurrence(e.target.value)}
                                                    className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                >
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                    <option value="yearly">Yearly</option>
                                                    <option value="custom">Custom Interval</option>
                                                </select>
                                            </div>

                                            {recurrence === 'custom' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Repeat Every (Days)</label>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={customInterval}
                                                            onChange={(e) => setCustomInterval(e.target.value)}
                                                            className="block w-full px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                            placeholder="e.g. 14"
                                                        />
                                                        <span className="bg-gray-50 border border-l-0 border-gray-300 px-4 py-3 text-gray-500 rounded-r-lg text-sm font-medium">Days</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800">Checklist Questions</h3>
                                <button
                                    onClick={addQuestion}
                                    className="text-sm text-primary-600 font-medium hover:text-primary-700 flex items-center"
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Question
                                </button>
                            </div>

                            {questions.map((q, index) => (
                                <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex gap-4 items-start group">
                                    <div className="pt-3 text-gray-400 font-medium text-xs">
                                        {index + 1}.
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <input
                                            type="text"
                                            value={q.text}
                                            onChange={(e) => updateQuestion(q.id, 'text', e.target.value)}
                                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                                            placeholder="Enter question text..."
                                        />
                                        <div className="flex items-center space-x-4">
                                            <select
                                                value={q.type}
                                                onChange={(e) => updateQuestion(q.id, 'type', e.target.value)}
                                                className="block w-40 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 outline-none bg-gray-50"
                                            >
                                                <option value="pass_fail">Pass / Fail</option>
                                                <option value="text">Text Response</option>
                                                <option value="rating">Rating (1-5)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeQuestion(q.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                        title="Remove Question"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium disabled:opacity-70"
                            >
                                {loading ? 'Saving Template...' : 'Save & Publish Template'}
                            </button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
};

export default TemplateBuilder;
