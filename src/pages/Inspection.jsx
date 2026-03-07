import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChecklistItem from '../components/ChecklistItem';
import BottomNav from '../components/BottomNav';

const Inspection = () => {
    const navigate = useNavigate();

    const checklistItems = [
        "Are fire extinguishers unobstructed?",
        "Are emergency exits clear?",
        "Is the fire alarm panel free of fault signals?",
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative pb-20">

            {/* Mobile Header */}
            <header className="bg-primary-600 text-white flex flex-col px-4 pt-4 pb-6 sticky top-0 z-30 shadow-md">
                <div className="flex items-center mb-4">
                    <button
                        onClick={() => navigate('/')}
                        className="mr-3 p-1 rounded-full hover:bg-primary-700 transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">Monthly Fire Safety Inspection</h1>
                        <p className="text-xs text-blue-100 opacity-90">Plant A • Shift 1</p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-blue-100">Progress</span>
                        <span className="text-xs font-bold text-white">30% Completed</span>
                    </div>
                    <div className="w-full bg-primary-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: '30%' }}
                        ></div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-4">
                <div className="max-w-md mx-auto space-y-4">
                    {checklistItems.map((item, index) => (
                        <ChecklistItem key={index} label={item} />
                    ))}
                </div>
            </main>

            {/* Floating Action Button - Complete Inspection */}
            <div className="fixed bottom-20 left-0 right-0 px-4 z-20 pointer-events-none">
                <div className="max-w-md mx-auto flex justify-end pointer-events-auto">
                    <button className="w-full py-4 bg-primary-600 text-white font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-colors transform active:scale-98">
                        Complete Inspection
                    </button>
                </div>
            </div>

            {/* Bottom Nav */}
            <BottomNav />
        </div>
    );
};

export default Inspection;
