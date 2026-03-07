import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { supabase } from '../lib/supabaseClient';
import { Send, Search, MessageCircle, MoreVertical, Phone, Video, Paperclip, Image as ImageIcon, X, FileText, Download } from 'lucide-react';

const Messages = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // 1. Initialize & Fetch Users
    useEffect(() => {
        const initialize = async () => {
            try {
                // Get Current User
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                setCurrentUser(user);

                // Get Current User's Profile (To get Company ID)
                const { data: myProfile } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', user.id)
                    .single();

                // Build query to fetch colleagues
                let query = supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, role, job_title')
                    .neq('id', user.id); // Exclude self

                // If user has a company, filter by it. Otherwise show all (fallback).
                if (myProfile?.company_id) {
                    query = query.eq('company_id', myProfile.company_id);
                }

                const { data: colleagues, error } = await query;

                if (error) throw error;

                // Fetch unread counts
                const { data: unreadData } = await supabase
                    .from('messages')
                    .select('sender_id')
                    .eq('receiver_id', user.id)
                    .eq('is_read', false);

                const colleaguesWithUnread = colleagues.map(colleague => {
                    const unreadCount = unreadData?.filter(m => m.sender_id === colleague.id).length || 0;
                    return { ...colleague, unread: unreadCount > 0, unreadCount };
                });

                setUsers(colleaguesWithUnread);

            } catch (error) {
                console.error('Error initializing messages:', error);
            } finally {
                setLoading(false);
            }
        };

        initialize();
    }, []);

    // 2. Fetch Messages when User Selected
    useEffect(() => {
        if (!selectedUser || !currentUser) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
                .order('created_at', { ascending: true });

            if (!error) {
                setMessages(data);

                // Mark messages as read
                const unreadMessages = data.filter(m => m.receiver_id === currentUser.id && !m.is_read);
                if (unreadMessages.length > 0) {
                    await supabase
                        .from('messages')
                        .update({ is_read: true })
                        .in('id', unreadMessages.map(m => m.id));

                    // Update local users state
                    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unread: false, unreadCount: 0 } : u));
                }
            }
        };

        fetchMessages();

        // 3. Real-time Subscription
        const channel = supabase
            .channel(`chat:${currentUser.id}-${selectedUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id}))`
                },
                (payload) => {
                    setMessages(prev => [...prev, payload.new]);

                    // Mark as read immediately if strictly the receiver
                    if (payload.new.receiver_id === currentUser.id) {
                        supabase
                            .from('messages')
                            .update({ is_read: true })
                            .eq('id', payload.new.id);
                    }
                    // Scroll to bottom
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };

    }, [selectedUser, currentUser]);

    // 4. Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, attachment]);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setAttachment(e.target.files[0]);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !selectedUser || !currentUser) return;

        try {
            setSending(true);
            let attachmentUrl = null;
            let attachmentType = null;

            // Handle File Upload if exists
            if (attachment) {
                setUploading(true);
                const fileExt = attachment.name.split('.').pop();
                const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`; // Removed redundant folder structure

                const { error: uploadError } = await supabase.storage
                    .from('message-attachments') // Ensure this bucket exists in Supabase
                    .upload(filePath, attachment);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('message-attachments')
                    .getPublicUrl(filePath);

                attachmentUrl = publicUrl;
                attachmentType = attachment.type.startsWith('image/') ? 'image' : 'file';
                setUploading(false);
            }

            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: currentUser.id,
                    receiver_id: selectedUser.id,
                    content: newMessage.trim(),
                    attachment_url: attachmentUrl,
                    attachment_type: attachmentType,
                    company_id: users.find(u => u.id === selectedUser.id)?.company_id || null // Ensure company_id is sent if required by policies
                });

            if (error) throw error;
            setNewMessage('');
            setAttachment(null);

            // Clear file input
            if (fileInputRef.current) fileInputRef.current.value = '';

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
        } finally {
            setSending(false);
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans overflow-hidden">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col h-screen">
                <Header />
                <main className="flex-1 flex p-6 gap-6 h-[calc(100vh-64px)] overflow-hidden">

                    {/* Left Column: User List */}
                    <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                        <div className="p-4 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Messages</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center p-8">
                                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center text-gray-500 p-8 text-sm">
                                    <p>No colleagues found.</p>
                                    <p className="text-xs mt-2">Add members in Team Management.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {users.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => setSelectedUser(user)}
                                            className={`w-full flex items-center p-4 hover:bg-gray-50 transition-colors text-left relative ${selectedUser?.id === user.id ? 'bg-indigo-50/60' : ''}`}
                                        >
                                            <div className="relative">
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100">
                                                    {user.avatar_url ? (
                                                        <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-gray-500 font-bold text-sm uppercase">{user.full_name ? user.full_name.charAt(0) : 'U'}</span>
                                                    )}
                                                </div>
                                                {/* Unread Indicator */}
                                                {user.unread && (
                                                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white"></span>
                                                )}
                                            </div>
                                            <div className="ml-3 flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h3 className={`text-sm font-medium truncate ${user.unread ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                                                        {user.full_name || 'Unknown User'}
                                                    </h3>
                                                    {user.unread && (
                                                        <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                                                            {user.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {user.job_title || user.role?.replace('_', ' ') || 'Team Member'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chat Window */}
                    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                        {selectedUser ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white z-10 shadow-sm">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
                                            {selectedUser.avatar_url ? (
                                                <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-gray-500 font-bold uppercase">{selectedUser.full_name ? selectedUser.full_name.charAt(0) : 'U'}</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">{selectedUser.full_name}</h3>
                                            <span className="flex items-center text-xs text-gray-500">
                                                {selectedUser.job_title || 'Team Member'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-full transition-colors">
                                            <Phone className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-50 rounded-full transition-colors">
                                            <Video className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="text-sm">No messages yet. Say hello!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isMe = msg.sender_id === currentUser.id;
                                            return (
                                                <div key={msg.id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${isMe
                                                        ? 'bg-primary-600 text-white rounded-br-none'
                                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                        }`}>
                                                        {msg.attachment_url && (
                                                            <div className="mb-2">
                                                                {msg.attachment_type === 'image' ? (
                                                                    <img
                                                                        src={msg.attachment_url}
                                                                        alt="Attachment"
                                                                        className="rounded-lg max-h-60 object-cover border border-white/20"
                                                                    />
                                                                ) : (
                                                                    <a
                                                                        href={msg.attachment_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className={`flex items-center p-3 rounded-lg ${isMe ? 'bg-primary-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}
                                                                    >
                                                                        <FileText className="w-5 h-5 mr-2" />
                                                                        <span className="underline">Download File</span>
                                                                        <Download className="w-4 h-4 ml-2 opacity-70" />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        )}
                                                        {msg.content && <p>{msg.content}</p>}
                                                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-100' : 'text-gray-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Attachment Preview */}
                                {attachment && (
                                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="p-2 bg-white rounded-lg border border-gray-200 mr-3">
                                                {attachment.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-purple-500" /> : <FileText className="w-5 h-5 text-blue-500" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700 truncate max-w-xs">{attachment.name}</p>
                                                <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                            className="p-1 hover:bg-gray-200 rounded-full text-gray-500"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Input Area */}
                                <div className="p-4 bg-white border-t border-gray-100">
                                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                            title="Attach File"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </button>

                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-gray-50"
                                        />

                                        <button
                                            type="submit"
                                            disabled={sending || (loading && !attachment) || (!newMessage.trim() && !attachment)}
                                            className="bg-primary-600 text-white p-2.5 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center w-11 h-11"
                                        >
                                            {uploading ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <Send className="w-5 h-5" />
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <MessageCircle className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Your Messages</h3>
                                <p className="text-sm text-gray-500 max-w-xs text-center">Select a colleague from the list to start a conversation.</p>
                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
};

export default Messages;