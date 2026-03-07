import React from 'react';
import { AlertCircle, CheckCircle2, UserPlus, FileText } from 'lucide-react';

const activities = [
    {
        id: 1,
        user: 'John Doe',
        action: 'reported a hazard',
        location: 'Plant A',
        time: '2 hours ago',
        icon: AlertCircle,
        color: 'text-amber-500',
        bg: 'bg-amber-50',
    },
    {
        id: 2,
        user: 'Sarah Smith',
        action: 'completed inspection',
        location: 'Warehouse B',
        time: '4 hours ago',
        icon: CheckCircle2,
        color: 'text-green-500',
        bg: 'bg-green-50',
    },
    {
        id: 3,
        user: 'Mike Johnson',
        action: 'added a new user',
        target: 'Emily Davis',
        time: '5 hours ago',
        icon: UserPlus,
        color: 'text-blue-500',
        bg: 'bg-blue-50',
    },
    {
        id: 4,
        user: 'System',
        action: 'generated monthly report',
        time: '1 day ago',
        icon: FileText,
        color: 'text-purple-500',
        bg: 'bg-purple-50',
    },
];

const RecentActivities = () => {
    return (
        <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Recent Activities</h3>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</button>
            </div>
            <div className="space-y-4">
                {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start">
                        <div className={`p-2 rounded-full ${activity.bg} mt-1 flex-shrink-0`}>
                            <activity.icon className={`w-4 h-4 ${activity.color}`} />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-800">
                                <span className="font-semibold">{activity.user}</span> {activity.action}
                                {activity.location && <span className="text-gray-600"> at {activity.location}</span>}
                                {activity.target && <span className="font-semibold"> {activity.target}</span>}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivities;
