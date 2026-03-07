import React, { useState } from 'react';
import { Check, X, Slash, Camera } from 'lucide-react';

const ChecklistItem = ({ label }) => {
    const [status, setStatus] = useState('none'); // 'pass', 'fail', 'na', 'none'

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-4">
            <div className="flex flex-col mb-3">
                <span className="text-base font-semibold text-gray-900 mb-3 leading-snug">{label}</span>
                <div className="flex bg-gray-50 rounded-xl p-1.5 gap-2">
                    <button
                        onClick={() => setStatus('pass')}
                        className={`flex-1 py-3 rounded-lg flex items-center justify-center transition-all ${status === 'pass'
                                ? 'bg-green-500 text-white shadow-md'
                                : 'bg-white text-gray-400 border border-gray-200 shadow-sm hover:border-gray-300'
                            }`}
                    >
                        <Check className="w-6 h-6" />
                        <span className="sr-only">Pass</span>
                    </button>
                    <button
                        onClick={() => setStatus('fail')}
                        className={`flex-1 py-3 rounded-lg flex items-center justify-center transition-all ${status === 'fail'
                                ? 'bg-red-500 text-white shadow-md'
                                : 'bg-white text-gray-400 border border-gray-200 shadow-sm hover:border-gray-300'
                            }`}
                    >
                        <X className="w-6 h-6" />
                        <span className="sr-only">Fail</span>
                    </button>
                    <button
                        onClick={() => setStatus('na')}
                        className={`flex-1 py-3 rounded-lg flex items-center justify-center transition-all ${status === 'na'
                                ? 'bg-gray-500 text-white shadow-md'
                                : 'bg-white text-gray-400 border border-gray-200 shadow-sm hover:border-gray-300'
                            }`}
                    >
                        <Slash className="w-6 h-6" />
                        <span className="sr-only">N/A</span>
                    </button>
                </div>
            </div>

            {/* Logic: Fail State Expansion */}
            {status === 'fail' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-3 border-t border-gray-100 mt-2">
                    <p className="text-sm text-red-600 font-medium mb-2">Please provide details for the failure:</p>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Describe issue..."
                            className="flex-1 text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 p-3 border shadow-sm outline-none"
                        />
                        <button className="flex items-center justify-center w-12 h-12 bg-gray-100 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors">
                            <Camera className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChecklistItem;
