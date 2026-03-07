import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, X, CheckCircle, Save, XCircle } from 'lucide-react';

const PerformInspection = () => {
    const { templateId } = useParams();
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchTemplate();
    }, [templateId]);

    const fetchTemplate = async () => {
        try {
            const { data, error } = await supabase
                .from('inspection_templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (error) throw error;
            setTemplate(data);

            // Initialize answers
            const initialAnswers = {};
            data.questions.forEach(q => {
                initialAnswers[q.id] = null;
            });
            setAnswers(initialAnswers);

        } catch (error) {
            console.error('Error fetching template:', error);
            alert('Failed to load inspection template.');
            navigate('/inspections');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const handleSubmit = async () => {
        if (!window.confirm('Are you sure you want to submit this inspection?')) return;

        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            // Fetch company_id
            const { data: profile } = await supabase
                .from('profiles')
                .select('company_id')
                .eq('id', user.id)
                .single();

            // Calculate Score (Simple: Pass/Fail % if applicable)
            let totalScorable = 0;
            let totalPassed = 0;
            template.questions.forEach(q => {
                if (q.type === 'pass_fail') {
                    totalScorable++;
                    if (answers[q.id] === 'pass') totalPassed++;
                }
            });
            const score = totalScorable > 0 ? (totalPassed / totalScorable) * 100 : null;

            const submissionData = {
                company_id: profile.company_id,
                template_id: template.id,
                inspector_id: user.id,
                answers: answers,
                status: 'completed',
                score: score,
                submitted_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('inspection_submissions')
                .insert(submissionData);

            if (error) throw error;

            // Handle One-Time Templates: Deactivate after submission
            if (template.schedule_type === 'one_time') {
                const { error: hiddenError } = await supabase
                    .from('inspection_templates')
                    .update({ is_active: false })
                    .eq('id', template.id);

                if (hiddenError) console.error('Error disabling one-time template:', hiddenError);
            }

            alert('Inspection submitted successfully!');
            navigate('/inspections');

        } catch (error) {
            console.error('Submit error:', error);
            alert('Failed to submit inspection. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading inspection...</div>;

    if (!template) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8">
                    <div className="max-w-3xl mx-auto">

                        <button
                            onClick={() => navigate('/inspections')}
                            className="flex items-center text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Cancel Inspection
                        </button>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h1 className="text-2xl font-bold text-gray-900">{template.title}</h1>
                                {template.description && <p className="text-gray-500 mt-1">{template.description}</p>}
                            </div>

                            <div className="p-6 space-y-8">
                                {template.questions.map((q, index) => (
                                    <div key={q.id} className="pb-6 border-b border-gray-100 last:border-0 last:pb-0">
                                        <p className="font-semibold text-gray-800 mb-3 text-lg">
                                            <span className="text-gray-400 mr-2">{index + 1}.</span>
                                            {q.text}
                                        </p>

                                        {/* Pass / Fail */}
                                        {q.type === 'pass_fail' && (
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => handleAnswerChange(q.id, 'pass')}
                                                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${answers[q.id] === 'pass'
                                                        ? 'border-green-500 bg-green-50 text-green-700 font-bold'
                                                        : 'border-gray-200 text-gray-500 hover:border-green-200 hover:bg-green-50/50'
                                                        }`}
                                                >
                                                    <CheckCircle className="w-6 h-6 mr-2" />
                                                    Pass
                                                </button>
                                                <button
                                                    onClick={() => handleAnswerChange(q.id, 'fail')}
                                                    className={`flex-1 flex items-center justify-center p-4 rounded-lg border-2 transition-all ${answers[q.id] === 'fail'
                                                        ? 'border-red-500 bg-red-50 text-red-700 font-bold'
                                                        : 'border-gray-200 text-gray-500 hover:border-red-200 hover:bg-red-50/50'
                                                        }`}
                                                >
                                                    <XCircle className="w-6 h-6 mr-2" />
                                                    Fail
                                                </button>
                                            </div>
                                        )}

                                        {/* Text Response */}
                                        {q.type === 'text' && (
                                            <textarea
                                                value={answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                rows={3}
                                                placeholder="Enter observations..."
                                            />
                                        )}

                                        {/* Rating */}
                                        {q.type === 'rating' && (
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(rating => (
                                                    <button
                                                        key={rating}
                                                        onClick={() => handleAnswerChange(q.id, rating)}
                                                        className={`w-12 h-12 rounded-lg font-bold text-lg border transition-all ${answers[q.id] === rating
                                                            ? 'bg-primary-600 text-white border-primary-600'
                                                            : 'bg-white text-gray-600 border-gray-300 hover:border-primary-500'
                                                            }`}
                                                    >
                                                        {rating}
                                                    </button>
                                                ))}
                                                <span className="self-center ml-2 text-sm text-gray-400">(1=Poor, 5=Excellent)</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center px-8 py-3 bg-primary-600 text-white text-lg font-medium rounded-xl hover:bg-primary-700 transition shadow-lg shadow-primary-500/30 disabled:opacity-70"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    {submitting ? 'Submitting...' : 'Complete Inspection'}
                                </button>
                            </div>

                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default PerformInspection;
