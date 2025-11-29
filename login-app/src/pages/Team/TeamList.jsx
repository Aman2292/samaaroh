import React, { useState, useEffect } from 'react';
import { People, Add, DocumentUpload, DocumentDownload } from 'iconsax-react';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import ImportCSVModal from '../../components/Team/ImportCSVModal';
import AddTeamMemberModal from '../../components/Team/AddTeamMemberModal';
import { toast } from 'react-toastify';

const TeamList = () => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    const canManageTeam = ['PLANNER_OWNER', 'PLANNER'].includes(userInfo.role);

    useEffect(() => {
        fetchTeamMembers();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:5001/api/team', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });

            const data = await response.json();

            if (response.ok) {
                setTeamMembers(data.data);
            } else {
                setError(data.error || 'Failed to fetch team members');
            }
        } catch (err) {
            setError('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/team/export-csv', {
                headers: {
                    'Authorization': `Bearer ${userInfo.token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `team-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Team members exported successfully');
            } else {
                toast.error('Failed to export team members');
            }
        } catch (error) {
            console.error('Error exporting CSV:', error);
            toast.error('Failed to connect to server');
        }
    };

    const getRoleBadge = (role) => {
        const roleConfig = {
            PLANNER_OWNER: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Owner' },
            PLANNER: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Planner' },
            FINANCE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Finance' },
            VENDOR: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Vendor' }
        };

        const config = roleConfig[role] || roleConfig.PLANNER;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getStatusBadge = (member) => {
        if (member.invitationStatus === 'pending') {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    Pending Invitation
                </span>
            );
        }
        if (!member.isActive) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Inactive
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Active
            </span>
        );
    };

    return (
        <div className="p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">Team Members</h1>
                        <p className="text-slate-500 mt-1">Manage your team</p>
                    </div>
                    {canManageTeam && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center space-x-2 px-4 py-2.5 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-medium"
                            >
                                <DocumentUpload size="20" color="currentColor" />
                                <span>Import CSV</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center space-x-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                            >
                                <DocumentDownload size="20" color="currentColor" />
                                <span>Export CSV</span>
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                            >
                                <Add size="20" color="currentColor" />
                                <span>Add Team Member</span>
                            </button>
                        </div>
                    )}
                </div>

                {showAddModal && (
                    <AddTeamMemberModal
                        onClose={() => setShowAddModal(false)}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchTeamMembers();
                        }}
                    />
                )}

                {showImportModal && (
                    <ImportCSVModal
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        onSuccess={() => {
                            fetchTeamMembers();
                        }}
                    />
                )}

                {loading ? (
                    <LoadingSkeleton type="table" count={5} />
                ) : error ? (
                    <ErrorMessage message={error} onRetry={fetchTeamMembers} />
                ) : teamMembers.length === 0 ? (
                    <EmptyState
                        icon={People}
                        title="No team members found"
                        description="Add team members to collaborate on events"
                        actionLabel={canManageTeam ? "+ Add First Team Member" : undefined}
                        onAction={canManageTeam ? () => alert('Add team member') : undefined}
                    />
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {teamMembers.map((member) => (
                                    <tr key={member._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-800">{member.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{member.email}</td>
                                        <td className="px-6 py-4 text-slate-600">{member.phone || 'N/A'}</td>
                                        <td className="px-6 py-4">{getRoleBadge(member.role)}</td>
                                        <td className="px-6 py-4">{getStatusBadge(member)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamList;
