import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, QrCode, Plus, History, PlayCircle, Download, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const InspectionList = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // QR Modal States
    const [viewQR, setViewQR] = useState(null); // { id, title } or null
    const [showScanner, setShowScanner] = useState(false);
    const scannerRef = useRef(null);

    useEffect(() => {
        fetchData();
    }, []);

    // Initialize Scanner when modal opens
    useEffect(() => {
        let scanner = null;
        if (showScanner) {
            // Check if element exists before initializing
            const timeoutId = setTimeout(() => {
                if (document.getElementById('reader')) {
                    scanner = new Html5QrcodeScanner(
                        "reader",
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
                        false
                    );
                    scanner.render(onScanSuccess, onScanFailure);
                    scannerRef.current = scanner;
                }
            }, 100); // Small delay to ensure DOM is ready

            return () => {
                clearTimeout(timeoutId);
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(error => console.error("Failed to clear scanner", error));
                    scannerRef.current = null;
                }
            };
        }
    }, [showScanner]);

    const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`Scan result: ${decodedText}`, decodedResult);
        // Simple UUID regex check
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (uuidRegex.test(decodedText)) {
            if (scannerRef.current) {
                scannerRef.current.clear().then(() => {
                    setShowScanner(false);
                    navigate(`/inspections/perform/${decodedText}`);
                });
            } else {
                setShowScanner(false);
                navigate(`/inspections/perform/${decodedText}`);
            }
        } else {
            alert("Invalid QR Code. Please scan a valid Inspection Template QR.");
        }
    };

    const onScanFailure = (error) => {
        // console.warn(`Code scan error = ${error}`);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Check Admin Status
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                setIsAdmin(profile?.role === 'admin');

                // Fetch Templates
                const { data: templateData, error: tmplError } = await supabase
                    .from('inspection_templates')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (tmplError) throw tmplError;
                setTemplates(templateData);

                // Fetch Recent History
                const { data: historyData, error: histError } = await supabase
                    .from('inspection_submissions')
                    .select('*, inspection_templates(title)')
                    .eq('inspector_id', user.id)
                    .order('submitted_at', { ascending: false })
                    .limit(5);

                if (histError) throw histError;
                setHistory(historyData);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadQR = () => {
        const canvas = document.getElementById('qr-gen');
        if (canvas) {
            const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
            let downloadLink = document.createElement("a");
            downloadLink.href = pngUrl;
            downloadLink.download = `${viewQR.title.replace(/\s+/g, '_')}_QR.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8">
                    <div className="max-w-6xl mx-auto">

                        {/* Header Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Inspections</h1>
                                <p className="text-gray-500 mt-1">Perform new inspections or review your history.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowScanner(true)}
                                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm font-medium"
                                >
                                    <QrCode className="w-5 h-5 mr-2" />
                                    Scan QR
                                </button>
                                {isAdmin && (
                                    <button
                                        onClick={() => navigate('/inspections/create')}
                                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition shadow-sm font-medium"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        New Template
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Available Templates */}
                        <div className="mb-10">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <ClipboardList className="w-5 h-5 mr-2 text-primary-600" />
                                Available Inspections
                            </h2>

                            {loading ? (
                                <p className="text-gray-500">Loading templates...</p>
                            ) : templates.length === 0 ? (
                                <div className="bg-white p-6 rounded-xl border border-dashed border-gray-300 text-center text-gray-500">
                                    No active inspection templates found.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {templates.map(template => (
                                        <div key={template.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-bold text-lg text-gray-900 mb-2">{template.title}</h3>
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => setViewQR({ id: template.id, title: template.title })}
                                                            className="text-gray-400 hover:text-indigo-600 p-1"
                                                            title="Get QR Code"
                                                        >
                                                            <QrCode className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{template.description || 'No description provided.'}</p>

                                                {/* Frequency Badge */}
                                                <div className="mb-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${template.schedule_type === 'one_time' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {template.schedule_type === 'one_time' ? 'One-Time' : `Recurring: ${template.recurrence}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <button
                                                    onClick={() => navigate(`/inspections/perform/${template.id}`)}
                                                    className="w-full flex items-center justify-center px-4 py-2 bg-primary-50 text-primary-700 font-medium rounded-lg hover:bg-primary-100 transition-colors"
                                                >
                                                    <PlayCircle className="w-5 h-5 mr-2" />
                                                    Start Inspection
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent History */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <History className="w-5 h-5 mr-2 text-gray-500" />
                                Recent History
                            </h2>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {loading ? (
                                    <div className="p-8 text-center text-gray-500">Loading history...</div>
                                ) : history.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">No recent inspections found.</div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Template</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {history.map(item => (
                                                <tr key={item.id} className="hover:bg-gray-50/50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {item.inspection_templates?.title || 'Unknown Template'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">
                                                        {new Date(item.submitted_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {item.score ? `${Math.round(item.score)}%` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                    </div>
                </main>
            </div>

            {/* GENERATE QR MODAL */}
            {viewQR && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center">
                        <div className="flex justify-between w-full items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Scan to Start</h3>
                            <button onClick={() => setViewQR(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200 mb-6">
                            <QRCodeCanvas
                                id="qr-gen"
                                value={viewQR.id}
                                size={200}
                                level={"H"}
                                includeMargin={true}
                            />
                        </div>

                        <p className="text-center text-gray-600 font-medium mb-6">{viewQR.title}</p>

                        <button
                            onClick={handleDownloadQR}
                            className="w-full flex items-center justify-center py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download QR Code
                        </button>
                    </div>
                </div>
            )}

            {/* SCANNER MODAL */}
            {showScanner && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-md w-full relative">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">Scan Inspection QR</h3>
                            <button
                                onClick={() => setShowScanner(false)}
                                className="text-gray-500 hover:text-red-500 bg-white p-1 rounded-full shadow-sm"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-0 bg-black relative min-h-[300px] flex items-center justify-center">
                            {/* The scanner renders here */}
                            <div id="reader" className="w-full" style={{ maxWidth: '400px' }}></div>
                        </div>

                        <div className="p-4 text-center bg-white border-t border-gray-100">
                            <p className="text-sm text-gray-500">Point your camera at a valid Template QR Code.</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default InspectionList;
