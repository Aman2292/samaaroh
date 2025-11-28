import React, { useState, useEffect } from 'react';
import { Danger } from 'iconsax-react';
import TransferOwnershipModal from '../../components/Settings/TransferOwnershipModal';
import DeleteOrganizationModal from '../../components/Settings/DeleteOrganizationModal';

const DangerZoneTab = ({ organization }) => {
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [stats, setStats] = useState(null);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchTeamMembers();
        fetchStats();
    }, []);

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/team', {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setTeamMembers(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch team members');
        }
    };

    const fetchStats = async () => {
        try {
            const [clientsRes, eventsRes, paymentsRes, usersRes] = await Promise.all([
                fetch('http://localhost:5001/api/clients?limit=1', {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }),
                fetch('http://localhost:5001/api/events?limit=1', {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }),
                fetch('http://localhost:5001/api/payments/outstanding', {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                }),
                fetch('http://localhost:5001/api/team', {
                    headers: { 'Authorization': `Bearer ${userInfo.token}` }
                })
            ]);

            const [clientsData, eventsData, paymentsData, usersData] = await Promise.all([
                clientsRes.json(),
                eventsRes.json(),
                paymentsRes.json(),
                usersRes.json()
            ]);

            setStats({
                clients: clientsData.pagination?.total || 0,
                events: eventsData.pagination?.total || 0,
                payments: paymentsData.data?.length || 0,
                users: usersData.data?.length || 0
            });
        } catch (error) {
            console.error('Failed to fetch stats');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h3 className="text-lg font-semibold text-red-600 flex items-center">
                    <Danger size="20" className="mr-2" />
                    Danger Zone
                </h3>
                <p className="text-sm text-slate-500 mt-1">Irreversible and destructive actions</p>
            </div>

            {/* Warning Banner */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Actions in this section are permanent and cannot be undone. Please proceed with caution.
                </p>
            </div>

            {/* Transfer Ownership */}
            <div className="border border-slate-200 rounded-lg p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 mb-2">Transfer Ownership</h4>
                        <p className="text-sm text-slate-600 mb-4">
                            Transfer organization ownership to another team member. You will become a regular planner after the transfer.
                        </p>
                        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                            <li>New owner must have PLANNER role</li>
                            <li>You will lose owner privileges</li>
                            <li>You will need to log in again</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => setShowTransferModal(true)}
                        className="ml-4 px-4 py-2 border border-yellow-600 text-yellow-600 rounded-lg hover:bg-yellow-50 whitespace-nowrap"
                    >
                        Transfer Ownership
                    </button>
                </div>
            </div>

            {/* Delete Organization */}
            <div className="border border-red-300 rounded-lg p-6 bg-red-50">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h4 className="font-semibold text-red-600 mb-2">Delete Organization</h4>
                        <p className="text-sm text-slate-600 mb-4">
                            Permanently delete your organization and all associated data. This action cannot be undone.
                        </p>
                        <p className="text-sm font-semibold text-red-700 mb-2">This will delete:</p>
                        <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                            <li>{stats?.clients || 0} clients</li>
                            <li>{stats?.events || 0} events</li>
                            <li>{stats?.payments || 0} payments</li>
                            <li>{stats?.users || 0} team members</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 whitespace-nowrap"
                    >
                        Delete Organization
                    </button>
                </div>
            </div>

            {/* Modals */}
            <TransferOwnershipModal
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                teamMembers={teamMembers}
                onSuccess={() => setShowTransferModal(false)}
            />

            <DeleteOrganizationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                organization={organization}
                stats={stats}
                onSuccess={() => setShowDeleteModal(false)}
            />
        </div>
    );
};

export default DangerZoneTab;
