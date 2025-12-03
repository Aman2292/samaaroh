import React from 'react';
import { Add, DocumentUpload, DocumentDownload, SearchNormal } from 'iconsax-react';

const GuestFilters = ({
    filters,
    setFilters,
    onAddGuest,
    onQuickAdd,
    onImport,
    onExport
}) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex items-center space-x-3">
                    <button
                        onClick={onAddGuest}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Add size="20" color="#ffffff" variant="Outline" />
                        <span>Add Guest</span>
                    </button>
                    <button
                        onClick={onQuickAdd}
                        className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <Add size="20" color="#ffffff" variant="Outline" />
                        <span>Quick Add (On-site)</span>
                    </button>
                    <button
                        onClick={onImport}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <DocumentUpload size="20" color="#ffffff" variant="Outline" />
                        <span>Import CSV</span>
                    </button>
                    <button
                        onClick={onExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        <DocumentDownload size="20" color="#ffffff" variant="Outline" />
                        <span>Export</span>
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <SearchNormal size="20" color="#94a3b8" variant="Outline" className="absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search guests..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <select
                    value={filters.side}
                    onChange={(e) => setFilters({ ...filters, side: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Sides</option>
                    <option value="bride">Bride</option>
                    <option value="groom">Groom</option>
                    <option value="both">Both</option>
                    <option value="vendor">Vendor</option>
                </select>

                <select
                    value={filters.group}
                    onChange={(e) => setFilters({ ...filters, group: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Groups</option>
                    <option value="family">Family</option>
                    <option value="friends">Friends</option>
                    <option value="vip">VIP</option>
                    <option value="vendor">Vendor</option>
                    <option value="other">Other</option>
                </select>

                <select
                    value={filters.rsvpStatus}
                    onChange={(e) => setFilters({ ...filters, rsvpStatus: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All RSVP Status</option>
                    <option value="invited">Invited</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="declined">Declined</option>
                    <option value="tentative">Tentative</option>
                    <option value="checked_in">Checked In</option>
                </select>

                <select
                    value={filters.source}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                    <option value="">All Sources</option>
                    <option value="manual">Manual Add</option>
                    <option value="csv_import">CSV Import</option>
                    <option value="onsite">On-site</option>
                </select>
            </div>
        </div>
    );
};

export default GuestFilters;
