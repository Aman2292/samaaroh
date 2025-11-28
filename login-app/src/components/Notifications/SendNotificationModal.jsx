import React, { useState } from 'react';
import { CloseCircle, Send } from 'iconsax-react';
import { toast } from 'react-toastify';

const SendNotificationModal = ({ isOpen, onClose }) => {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    React.useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    const fetchUsers = async () => {
        try {
            setFetchingUsers(true);
            const response = await fetch('http://localhost:5001/api/team', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                // Filter users based on role permissions for display if needed, 
                // but backend handles the actual sending restriction.
                // For better UX, we can filter here too.
                let availableUsers = data.data || [];
                if (userInfo.role === 'PLANNER') {
                    availableUsers = availableUsers.filter(u =>
                        u.role === 'FINANCE' || u.role === 'COORDINATOR'
                    );
                }
                // Exclude self
                availableUsers = availableUsers.filter(u => u._id !== userInfo._id);
                setUsers(availableUsers);
            }
        } catch (error) {
            console.error('Failed to fetch users');
        } finally {
            setFetchingUsers(false);
        }
    };

    const toggleUser = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !message.trim()) {
            toast.error('Title and message are required');
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({
                    title,
                    message,
                    link,
                    taggedUserIds: selectedUsers
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message);
                onClose();
                setTitle('');
                setMessage('');
                setLink('');
                setSelectedUsers([]);
            } else {
                toast.error(data.error || 'Failed to send notification');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
                    <h3 className="font-bold text-slate-800">Send Notification</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <CloseCircle size="24" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6 space-y-4 flex-1">
                    <form id="notification-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="e.g., Team Meeting"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all h-24 resize-none"
                                placeholder="Type your message here..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Link (Optional)</label>
                            <input
                                type="text"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                placeholder="e.g., /events"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Tag Users (Optional)</label>
                            {fetchingUsers ? (
                                <div className="text-sm text-slate-500">Loading users...</div>
                            ) : users.length === 0 ? (
                                <div className="text-sm text-slate-500">No users found</div>
                            ) : (
                                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                                    {users.map(user => (
                                        <div key={user._id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`user-${user._id}`}
                                                checked={selectedUsers.includes(user._id)}
                                                onChange={() => toggleUser(user._id)}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                                            />
                                            <label htmlFor={`user-${user._id}`} className="ml-2 block text-sm text-slate-700 cursor-pointer select-none">
                                                {user.name} <span className="text-xs text-slate-400">({user.role.replace('_', ' ')})</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <p className="text-xs text-slate-500 mt-1">Leave empty to send to all allowed users.</p>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0">
                    <button
                        type="submit"
                        form="notification-form"
                        disabled={loading}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <Send size="20" />
                                <span>Send Notification</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendNotificationModal;
