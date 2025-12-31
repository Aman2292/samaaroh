import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchNormal1, Calendar, User, DocumentText } from 'iconsax-react';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ events: [], clients: [], invoices: [] });
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults({ events: [], clients: [], invoices: [] });
            setShowResults(false);
            return;
        }

        const delaySearch = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [query]);

    const performSearch = async () => {
        try {
            setLoading(true);
            const token = userInfo.token;

            // Search events, clients, and invoices in parallel
            const [eventsRes, clientsRes, invoicesRes] = await Promise.all([
                fetch(`http://localhost:5001/api/events?search=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:5001/api/clients?search=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:5001/api/invoices?search=${encodeURIComponent(query)}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const eventsData = await eventsRes.json();
            const clientsData = await clientsRes.json();
            const invoicesData = await invoicesRes.json();

            setResults({
                events: eventsData.data?.slice(0, 5) || [],
                clients: clientsData.docs?.slice(0, 5) || [],
                invoices: invoicesData.data?.slice(0, 5) || []
            });
            setShowResults(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (type, id) => {
        setQuery('');
        setShowResults(false);

        if (type === 'event') {
            navigate(`/events/${id}`);
        } else if (type === 'client') {
            navigate(`/clients`);
        } else if (type === 'invoice') {
            navigate(`/invoices`);
        }
    };

    const totalResults = results.events.length + results.clients.length + results.invoices.length;

    return (
        <div ref={searchRef} className="relative flex-1 max-w-xl">
            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search events, clients, invoices..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <SearchNormal1
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Search Results Dropdown */}
            {showResults && query.length >= 2 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-slate-200 max-h-96 overflow-y-auto z-50">
                    {totalResults === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                            <p className="text-sm">No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {/* Events Results */}
                            {results.events.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Events ({results.events.length})
                                    </div>
                                    {results.events.map((event) => (
                                        <button
                                            key={event._id}
                                            onClick={() => handleResultClick('event', event._id)}
                                            className="w-full px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors"
                                        >
                                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <Calendar size={18} className="text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-900 truncate">
                                                    {event.eventName}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {new Date(event.eventDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Clients Results */}
                            {results.clients.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Clients ({results.clients.length})
                                    </div>
                                    {results.clients.map((client) => (
                                        <button
                                            key={client._id}
                                            onClick={() => handleResultClick('client', client._id)}
                                            className="w-full px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors"
                                        >
                                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <User size={18} className="text-green-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-900 truncate">
                                                    {client.name}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {client.email}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Invoices Results */}
                            {results.invoices.length > 0 && (
                                <div>
                                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Invoices ({results.invoices.length})
                                    </div>
                                    {results.invoices.map((invoice) => (
                                        <button
                                            key={invoice._id}
                                            onClick={() => handleResultClick('invoice', invoice._id)}
                                            className="w-full px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-left transition-colors"
                                        >
                                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <DocumentText size={18} className="text-purple-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-slate-900 truncate">
                                                    Invoice #{invoice.invoiceNumber}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    ₹{invoice.total?.toLocaleString()} • {invoice.status}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
