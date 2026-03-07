import React from 'react';
import { Home, QrCode, ClipboardCheck, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BottomNav = () => {
    const navigate = useNavigate();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 flex items-center justify-around z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
            <button onClick={() => navigate('/')} className="flex flex-col items-center text-gray-400 hover:text-primary-600">
                <Home className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Home</span>
            </button>
            <button className="flex flex-col items-center text-gray-400 hover:text-primary-600">
                <QrCode className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Scan</span>
            </button>
            <button className="flex flex-col items-center text-primary-600">
                <ClipboardCheck className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Checklist</span>
            </button>
            <button className="flex flex-col items-center text-gray-400 hover:text-primary-600">
                <User className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Profile</span>
            </button>
        </div>
    );
};

export default BottomNav;
