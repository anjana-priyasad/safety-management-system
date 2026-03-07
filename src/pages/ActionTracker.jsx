import React, { useState } from 'react';
import {
    Filter,
    MoreVertical,
    MessageSquare,
    X,
    CheckCircle,
    Clock,
    AlertCircle,
    Paperclip,
    Send,
    User
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

const ActionTracker = () => {
    const [selectedTask, setSelectedTask] = useState(null);

    const tasks = [
        {
            id: 'ACT-001',
            title: 'Repair broken guard rail at Plant B',
            incidentId: 'INC-204',
            status: 'Overdue',
            priority: 'High',
            assignee: 'John Smith',
            assigneeInitials: 'JS',
            assigneeColor: 'bg-blue-100 text-blue-600',
            dueDate: 'Jan 15, 2024',
            description: 'The guard rail on the 2nd floor platform has come loose and needs immediate welding.'
        },
        {
            id: 'ACT-002',
            title: 'Update fire extinguisher tags in Warehouse',
            incidentId: 'INS-012',
            status: 'In Progress',
            priority: 'Medium',
            assignee: 'Sarah Connor',
            assigneeInitials: 'SC',
            assigneeColor: 'bg-purple-100 text-purple-600',
            dueDate: 'Jan 22, 2024',
            description: 'Monthly inspection revealed expired tags on 3 units in Zone A.'
        },
        {
            id: 'ACT-003',
            title: 'Conduct ergonomics training for morning shift',
            incidentId: 'INC-199',
            status: 'Open',
            priority: 'Medium',
            assignee: 'Mike Ross',
            assigneeInitials: 'MR',
            assigneeColor: 'bg-emerald-100 text-emerald-600',
            dueDate: 'Jan 28, 2024',
            description: 'Scheduled training session required following the recent back strain incident.'
        },
        {
            id: 'ACT-004',
            title: 'Replace flickering lights in Corridor 4',
            incidentId: 'REP-005',
            status: 'Completed',
            priority: 'Low',
            assignee: 'Davos Seaworth',
            assigneeInitials: 'DS',
            assigneeColor: 'bg-orange-100 text-orange-600',
            dueDate: 'Jan 10, 2024',
            description: 'reported by night shift security.'
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'text-red-500';
            case 'Medium': return 'text-amber-500';
            case 'Low': return 'text-blue-500';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <Sidebar />
            <div className="flex-1 ml-64">
                <Header />
                <main className="p-8">

                    {/* Page Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Action Tracker</h1>
                            <p className="text-sm text-gray-500 mt-1">Manage and track corrective actions</p>
                        </div>
                        <div className="flex space-x-3">
                            <button className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </button>
                            <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm">
                                <PlusIcon />
                                New Action
                            </button>
                        </div>
                    </div>

                    {/* Task List */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-5">Task Details</div>
                            <div className="col-span-2">Assignee</div>
                            <div className="col-span-2">Due Date</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* List Items */}
                        <div className="divide-y divide-gray-100">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => setSelectedTask(task)}
                                    className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                >
                                    <div className="col-span-5">
                                        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">{task.title}</h3>
                                        <div className="flex items-center mt-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded textxs font-medium bg-gray-100 text-gray-600 text-[10px] mr-2">
                                                {task.id}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center">
                                                Linked to <span className="font-medium text-gray-700 ml-1 hover:underline">{task.incidentId}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="col-span-2 flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${task.assigneeColor}`}>
                                            {task.assigneeInitials}
                                        </div>
                                        <span className="text-sm text-gray-700">{task.assignee}</span>
                                    </div>

                                    <div className="col-span-2">
                                        <div className={`flex items-center text-sm ${task.status === 'Overdue' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                            <Clock className="w-4 h-4 mr-1.5" />
                                            {task.dueDate}
                                        </div>
                                    </div>

                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                                            {task.status}
                                        </span>
                                    </div>

                                    <div className="col-span-1 flex justify-end">
                                        <button className="p-1 text-gray-400 hover:text-gray-600">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </main>
            </div>

            {/* Side Drawer */}
            {selectedTask && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
                        onClick={() => setSelectedTask(null)}
                    ></div>

                    {/* Drawer Panel */}
                    <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">

                        {/* Drawer Header */}
                        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-white">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                    {selectedTask.id}
                                    <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedTask.status)}`}>
                                        {selectedTask.status}
                                    </span>
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto p-6">

                            <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedTask.title}</h3>

                            <div className="flex items-center text-sm text-gray-500 mb-6 space-x-4">
                                <span className="flex items-center">
                                    <AlertCircle className={`w-4 h-4 mr-1 ${getPriorityColor(selectedTask.priority)}`} />
                                    {selectedTask.priority} Priority
                                </span>
                                <span className="flex items-center">
                                    Due {selectedTask.dueDate}
                                </span>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</h4>
                                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    {selectedTask.description}
                                </p>
                            </div>

                            <div className="mb-8">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Assignee</h4>
                                <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${selectedTask.assigneeColor}`}>
                                        {selectedTask.assigneeInitials}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{selectedTask.assignee}</p>
                                        <p className="text-xs text-gray-500">Safety Officer</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comments & Updates</h4>
                                    <span className="text-xs text-gray-400">2 comments</span>
                                </div>

                                <div className="space-y-4 mb-6">
                                    {/* Mock Comment 1 */}
                                    <div className="flex space-x-3">
                                        <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-500" />
                                        </div>
                                        <div className="flex-1 bg-gray-50 p-3 rounded-lg rounded-tl-none text-sm text-gray-700">
                                            <p><span className="font-semibold text-gray-900 mr-1">System</span> Linked this action to Incident INC-204.</p>
                                            <span className="text-xs text-gray-400 mt-1 block">Jan 10, 10:30 AM</span>
                                        </div>
                                    </div>

                                    {/* Mock Comment 2 */}
                                    <div className="flex space-x-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600 font-bold text-xs">
                                            JS
                                        </div>
                                        <div className="flex-1 bg-gray-50 p-3 rounded-lg rounded-tl-none text-sm text-gray-700">
                                            <p>Parts have been ordered. Expected delivery tomorrow.</p>
                                            <span className="text-xs text-gray-400 mt-1 block">Jan 11, 2:15 PM</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Drawer Footer (Comment Input) */}
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                                />
                                <button className="absolute right-2 top-2 p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors">
                                    <Send className="w-5 h-5" />
                                </button>
                                <button className="absolute right-10 top-2 p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
                                    <Paperclip className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                    </div>
                </>
            )}

        </div>
    );
};

// Helper for the add button icon
const PlusIcon = () => (
    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export default ActionTracker;
