import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, ArrowLeft, TickCircle, Refresh2, User, Calendar, Warning2 } from 'iconsax-react';
import { toast } from 'react-toastify';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';

const AdminOrganizationDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [features, setFeatures] = useState({});
    const [actionLoading, setActionLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('features'); // 'features' or 'logs'

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchOrgDetails();
    }, [id]);

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchLogs();
        }
    }, [activeTab, id]);

    const fetchOrgDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5001/api/admin/organizations/${id}`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setOrg(data.data);
                initializeFeatures(data.data.subscribedFeatures || {});
            } else {
                toast.error(data.error || 'Failed to fetch organization details');
                navigate('/admin/organizations');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/organizations/${id}/activity`, {
                headers: { 'Authorization': `Bearer ${userInfo.token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setLogs(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        }
    };

    const initializeFeatures = (orgFeatures) => {
        const defaultFeatures = {
            clients: true,
            events: { access: true, guests: true, payments: true, tasks: true },
            payments: { access: true, client: true, vendor: true },
            team: { access: true, manage: true, export: true },
            venue: { access: true, profile: true, gallery: true, packages: true, availability: true, tasks: true }
        };

        const normalize = (val, defaults) => {
            if (val === true || val === false) return { ...defaults, access: val };
            if (val && typeof val === 'object') return { ...defaults, ...val };
            return defaults;
        };

        const mergedFeatures = {
            ...defaultFeatures,
            clients: orgFeatures.clients ?? defaultFeatures.clients,
            events: normalize(orgFeatures.events, defaultFeatures.events),
            payments: normalize(orgFeatures.payments, defaultFeatures.payments),
            team: normalize(orgFeatures.team, defaultFeatures.team),
            venue: normalize(orgFeatures.venue, defaultFeatures.venue)
        };
        setFeatures(mergedFeatures);
    };

    const toggleFeature = (key, subKey = null) => {
        if (subKey) {
            setFeatures(prev => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    [subKey]: !prev[key][subKey]
                }
            }));
        } else {
            setFeatures(prev => {
                const currentVal = prev[key];
                const isObject = typeof currentVal === 'object';
                if (isObject) {
                    return { ...prev, [key]: { ...prev[key], access: !prev[key].access } };
                }
                return { ...prev, [key]: !currentVal };
            });
        }
    };

    const handleUpdateFeatures = async () => {
        try {
            setActionLoading(true);
            const response = await fetch(`http://localhost:5001/api/admin/organizations/${id}/features`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ features })
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Features updated successfully');
                fetchOrgDetails();
            } else {
                toast.error(data.error || 'Failed to update features');
            }
        } catch (error) {
            toast.error('Failed to connect to server');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-8"><LoadingSkeleton type="card" count={1} /></div>;
    if (!org) return null;

    const FeatureSection = ({ title, featureKey, subFeatures = [] }) => (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                <span className="font-semibold text-slate-700">{title}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={features[featureKey]?.access}
                        onChange={() => toggleFeature(featureKey)}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
            </div>
            {features[featureKey]?.access && subFeatures.length > 0 && (
                <div className="p-4 space-y-3">
                    {subFeatures.map((sub) => (
                        <div key={sub.key} className="flex items-center justify-between pl-4 border-l-2 border-slate-100 ml-2">
                            <span className="text-sm text-slate-600">{sub.label}</span>
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500 cursor-pointer"
                                checked={features[featureKey]?.[sub.key]}
                                onChange={() => toggleFeature(featureKey, sub.key)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderLogs = () => (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Activity Logs</h2>
                <p className="text-sm text-slate-500">Recent actions performed by members of this organization</p>
            </div>
            {logs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No activity logs found</div>
            ) : (
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Details</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map((log) => (
                            <tr key={log._id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-800">{log.userId?.name || 'Unknown User'}</div>
                                    <div className="text-xs text-slate-500">{log.userRole?.replace('_', ' ')}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {JSON.stringify(log.details || log.metadata || {})}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-slate-500">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    return (
        <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={() => navigate('/admin/organizations')}
                    className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 mb-4 transition-colors"
                >
                    <ArrowLeft size="20" />
                    <span>Back to Organizations</span>
                </button>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800">{org.name}</h1>
                        <div className="flex items-center space-x-4 mt-2 text-slate-500">
                            <span className="flex items-center space-x-1">
                                <Building size="16" />
                                <span>{org.city || 'No City'}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <User size="16" />
                                <span>{org.ownerUserId?.name || 'No Owner'}</span>
                            </span>
                        </div>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => navigate(`/events?organizationId=${id}`)}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center space-x-2"
                        >
                            <Calendar size={20} />
                            <span>View Events</span>
                        </button>
                        <button
                            onClick={fetchOrgDetails}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Refresh2 size="24" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 border-b border-slate-200 mb-8">
                <button
                    onClick={() => setActiveTab('features')}
                    className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'features' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    Features
                    {activeTab === 'features' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'logs' ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
                        }`}
                >
                    Activity Logs
                    {activeTab === 'logs' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full"></div>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'features' ? (
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Feature Access</h2>
                                    <p className="text-sm text-slate-500">Enable or disable features for this organization</p>
                                </div>
                                <button
                                    onClick={handleUpdateFeatures}
                                    disabled={actionLoading}
                                    className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 shadow-md shadow-primary-200 transition-all disabled:opacity-70"
                                >
                                    {actionLoading ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FeatureSection
                                    title="Events Module"
                                    featureKey="events"
                                    subFeatures={[
                                        { key: 'guests', label: 'Guest List' },
                                        { key: 'payments', label: 'Payments' },
                                        { key: 'tasks', label: 'Tasks' }
                                    ]}
                                />

                                <FeatureSection
                                    title="Team Management"
                                    featureKey="team"
                                    subFeatures={[
                                        { key: 'manage', label: 'Add/Remove Members' },
                                        { key: 'export', label: 'Export Data' }
                                    ]}
                                />

                                <FeatureSection
                                    title="Venue Management"
                                    featureKey="venue"
                                    subFeatures={[
                                        { key: 'profile', label: 'Profile' },
                                        { key: 'gallery', label: 'Gallery' },
                                        { key: 'packages', label: 'Packages' },
                                        { key: 'availability', label: 'Availability' }
                                    ]}
                                />

                                <FeatureSection
                                    title="Global Payments"
                                    featureKey="payments"
                                    subFeatures={[
                                        { key: 'client', label: 'Client Payments' },
                                        { key: 'vendor', label: 'Vendor Payments' }
                                    ]}
                                />

                                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm p-4 flex items-center justify-between">
                                    <span className="font-semibold text-slate-700">Client Management</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={features.clients}
                                            onChange={() => toggleFeature('clients')}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ) : (
                        renderLogs()
                    )}
                </div>

                {/* Sidebar: Stats & Info */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Subscription Status</h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                <span className="text-slate-300 text-sm">Plan</span>
                                <span className="font-semibold text-indigo-300">Free Trial</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                                <span className="text-slate-300 text-sm">Status</span>
                                <span className={`px-2 py-0.5 rounded textxs font-bold ${org.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {org.status?.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOrganizationDetails;
