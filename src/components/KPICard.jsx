import React from 'react';

const KPICard = ({ title, value, icon: Icon, trend, trendDown }) => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex items-start justify-between hover:shadow-sm transition-shadow">
            <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                {trend && (
                    <p className={`text-xs font-medium mt-2 flex items-center ${trendDown ? 'text-red-500' : 'text-green-500'}`}>
                        {trend}
                        <span className="ml-1 text-gray-400 font-normal">vs last month</span>
                    </p>
                )}
            </div>
            <div className="p-2 bg-primary-50 rounded-lg">
                <Icon className="w-6 h-6 text-primary-600" />
            </div>
        </div>
    );
};

export default KPICard;
