import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HomeIcon,
    BuildingOfficeIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    BanknotesIcon,
    UsersIcon,
    Cog6ToothIcon,
    DocumentTextIcon,
    DocumentDuplicateIcon,
    FolderIcon,
    ListBulletIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    BuildingOfficeIcon as BuildingOfficeIconSolid,
    UserGroupIcon as UserGroupIconSolid,
    CalendarDaysIcon as CalendarDaysIconSolid,
    BanknotesIcon as BanknotesIconSolid,
    UsersIcon as UsersIconSolid,
    Cog6ToothIcon as Cog6ToothIconSolid,
    DocumentTextIcon as DocumentTextIconSolid,
    DocumentDuplicateIcon as DocumentDuplicateIconSolid,
    FolderIcon as FolderIconSolid,
    ListBulletIcon as ListBulletIconSolid
} from '@heroicons/react/24/solid';

const ModernSidebar = ({ isCollapsed, setIsCollapsed, userInfo, features }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const [expandedSections, setExpandedSections] = useState(['events']);

    const canAccessClients = ['PLANNER_OWNER', 'PLANNER', 'FINANCE'].includes(userInfo.role) && features.clients;
    const canAccessEvents = features.events?.access !== false;
    const canAccessTeam = userInfo.role === 'PLANNER_OWNER' && features.team;
    const canAccessPayments = ['PLANNER_OWNER', 'FINANCE'].includes(userInfo.role) && features.payments;
    const canAccessVenue = userInfo.role === 'PLANNER_OWNER' && features.venue;
    const isSuperAdmin = userInfo.role === 'SUPER_ADMIN';

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    const toggleSection = (section) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const menuSections = [
        {
            title: null,
            show: true,
            items: [
                { path: '/', OutlineIcon: HomeIcon, SolidIcon: HomeIconSolid, label: t('sidebar.dashboard'), show: true }
            ]
        },
        {
            title: t('sidebar.admin'),
            show: isSuperAdmin,
            items: [
                { path: '/admin/organizations', OutlineIcon: BuildingOfficeIcon, SolidIcon: BuildingOfficeIconSolid, label: t('sidebar.organizations'), show: true },
                { path: '/admin/events', OutlineIcon: CalendarDaysIcon, SolidIcon: CalendarDaysIconSolid, label: t('sidebar.events'), show: true },
                { path: '/admin/users', OutlineIcon: UserGroupIcon, SolidIcon: UserGroupIconSolid, label: t('sidebar.users'), show: true },
            ]
        },
        {
            title: t('sidebar.management') || 'Management',
            show: !isSuperAdmin,
            items: [
                { path: '/venue', OutlineIcon: BuildingOfficeIcon, SolidIcon: BuildingOfficeIconSolid, label: t('sidebar.venues'), show: canAccessVenue },
                { path: '/clients', OutlineIcon: UserGroupIcon, SolidIcon: UserGroupIconSolid, label: t('sidebar.clients'), show: canAccessClients },
                {
                    label: t('sidebar.events'),
                    OutlineIcon: CalendarDaysIcon,
                    SolidIcon: CalendarDaysIconSolid,
                    show: canAccessEvents,
                    expandable: true,
                    section: 'events',
                    subItems: [
                        { path: '/events', label: t('sidebar.allEvents') || 'All Events' },
                        { path: '/events/create', label: t('sidebar.createEvent') || 'Create Event' }
                    ]
                },
                { path: '/payments/outstanding', OutlineIcon: BanknotesIcon, SolidIcon: BanknotesIconSolid, label: t('sidebar.payments'), show: canAccessPayments },
                { path: '/team', OutlineIcon: UsersIcon, SolidIcon: UsersIconSolid, label: t('sidebar.team'), show: canAccessTeam },
            ]
        },
        {
            title: t('sidebar.documents') || 'Documents',
            show: !isSuperAdmin,
            items: [
                { path: '/invoices', OutlineIcon: DocumentTextIcon, SolidIcon: DocumentTextIconSolid, label: t('sidebar.invoices'), show: userInfo.role === 'PLANNER_OWNER' || userInfo.role === 'FINANCE' },
                { path: '/documents', OutlineIcon: FolderIcon, SolidIcon: FolderIconSolid, label: t('sidebar.documents'), show: userInfo.role === 'PLANNER_OWNER' || userInfo.role === 'FINANCE' },
                { path: '/activity-logs', OutlineIcon: DocumentDuplicateIcon, SolidIcon: DocumentDuplicateIconSolid, label: t('sidebar.activityLogs'), show: canAccessTeam },
            ]
        },
        {
            title: t('sidebar.settings') || 'Settings',
            show: true,
            items: [
                { path: '/settings', OutlineIcon: Cog6ToothIcon, SolidIcon: Cog6ToothIconSolid, label: t('sidebar.settings'), show: canAccessTeam || isSuperAdmin },
                { path: '/tasks', OutlineIcon: ListBulletIcon, SolidIcon: ListBulletIconSolid, label: t('sidebar.tasks'), show: userInfo.role === 'PLANNER_OWNER' && features.tasks },
                { path: '/profile', OutlineIcon: UserGroupIcon, SolidIcon: UserGroupIconSolid, label: t('sidebar.profile'), show: true },
            ]
        }
    ];

    return (
        <aside className={`bg-white border-r border-slate-200 flex flex-col transition-all duration-300 h-screen fixed ${isCollapsed ? 'w-20' : 'w-64'}`}>
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                            Samaaroh
                        </h1>
                        <p className="text-xs text-slate-500 mt-1.5 uppercase tracking-wide font-semibold">{userInfo.role?.replace('_', ' ')}</p>
                    </div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
                >
                    {isCollapsed ? (
                        <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                    ) : (
                        <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                    )}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {menuSections.map((section, sectionIdx) => {
                    if (!section.show) return null;

                    return (
                        <div key={sectionIdx} className="space-y-1">
                            {/* Section Title */}
                            {section.title && !isCollapsed && (
                                <div className="px-3 pt-5 pb-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        {section.title}
                                    </p>
                                </div>
                            )}

                            {/* Section Items with curved connecting lines */}
                            <div className="relative">
                                {section.items.map((item, itemIdx) => {
                                    if (!item.show) return null;

                                    const active = item.path && isActive(item.path);
                                    const Icon = active ? item.SolidIcon : item.OutlineIcon;
                                    const isExpanded = item.expandable && expandedSections.includes(item.section);
                                    const visibleItems = section.items.filter(i => i.show);
                                    const isLastItem = itemIdx === visibleItems.length - 1;

                                    if (item.expandable) {
                                        return (
                                            <div key={item.label} className="relative">
                                                {/* Parent Item */}
                                                <button
                                                    onClick={() => toggleSection(item.section)}
                                                    className={`flex items-center justify-between w-full px-3 py-3 rounded-xl transition-all relative ${active
                                                        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100'
                                                        : 'text-slate-700 hover:bg-slate-50'
                                                        }`}
                                                    title={isCollapsed ? item.label : ''}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
                                                        {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                                                    </div>
                                                    {!isCollapsed && (
                                                        isExpanded ? (
                                                            <ChevronUpIcon className="w-4 h-4 text-slate-400" />
                                                        ) : (
                                                            <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                                                        )
                                                    )}
                                                </button>

                                                {/* Sub Items with curved connectors */}
                                                {isExpanded && !isCollapsed && item.subItems && (
                                                    <div className="mt-1 space-y-1 relative">
                                                        {item.subItems.map((subItem, subIdx) => {
                                                            const isLastSubItem = subIdx === item.subItems.length - 1;

                                                            return (
                                                                <div key={subItem.path} className="relative ml-8">
                                                                    {/* Curved connector - L-shape with border-radius */}
                                                                    <div
                                                                        className="absolute"
                                                                        style={{
                                                                            top: subIdx === 0 ? '0' : '-8px',
                                                                            left: '-20px',
                                                                            width: '16px',
                                                                            height: subIdx === 0 ? '22px' : '28px',
                                                                            borderLeft: '1.5px solid #cbd5e1',
                                                                            borderBottom: '1.5px solid #cbd5e1',
                                                                            borderBottomLeftRadius: '10px'
                                                                        }}
                                                                    />

                                                                    {/* Vertical line connecting to next sub-item (only if not last) */}
                                                                    {!isLastSubItem && (
                                                                        <div
                                                                            className="absolute"
                                                                            style={{
                                                                                top: subIdx === 0 ? '22px' : '20px',
                                                                                left: '-20px',
                                                                                width: '1.5px',
                                                                                height: 'calc(100% - 14px)',
                                                                                backgroundColor: '#cbd5e1'
                                                                            }}
                                                                        />
                                                                    )}

                                                                    <button
                                                                        onClick={() => navigate(subItem.path)}
                                                                        className={`flex items-center w-full px-3 py-1.5 rounded-lg text-sm transition-all ${isActive(subItem.path)
                                                                            ? 'bg-blue-50 text-blue-700 font-semibold'
                                                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                                            }`}
                                                                    >
                                                                        <span className="truncate">{subItem.label}</span>
                                                                    </button>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={item.path} className="relative">
                                            <button
                                                onClick={() => navigate(item.path)}
                                                className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl transition-all relative ${active
                                                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100'
                                                    : 'text-slate-700 hover:bg-slate-50'
                                                    }`}
                                                title={isCollapsed ? item.label : ''}
                                            >
                                                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-slate-500'}`} />
                                                {!isCollapsed && <span className="text-sm truncate">{item.label}</span>}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
};

export default ModernSidebar;
