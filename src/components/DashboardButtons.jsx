import React from 'react';
import { Plus, ClipboardList, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardButtons = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    onClick={() => navigate('/report-incident')}
                    className="flex items-center justify-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Report Incident
                </button>
                <button
                    onClick={() => navigate('/inspection')}
                    className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors font-medium shadow-sm"
                >
                    <ClipboardList className="w-5 h-5 mr-2 text-gray-500" />
                    Start Inspection
                </button>
                <button className="flex items-center justify-center px-4 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md transition-colors font-medium shadow-sm">
                    <UserPlus className="w-5 h-5 mr-2 text-gray-500" />
                    Add User
                </button>
            </div>
        </div>
    );
};

export default DashboardButtons;
