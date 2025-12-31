import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Scan, TickCircle, CloseCircle, Refresh2, People, Add, Minus } from 'iconsax-react';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/api';
import { Html5QrcodeScanner } from 'html5-qrcode';

const CheckInScanner = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [scannedGuest, setScannedGuest] = useState(null);
    const [headcount, setHeadcount] = useState(1);
    const [notes, setNotes] = useState('');
    const [stats, setStats] = useState({});
    const [manualCode, setManualCode] = useState('');
    const [showManualInput, setShowManualInput] = useState(false);
    const [recentCheckIns, setRecentCheckIns] = useState([]);

    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    useEffect(() => {
        fetchStats();
        // Refresh stats every 10 seconds
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, [eventId]);

    const fetchStats = async () => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/guests/event/${eventId}/check-in-stats`,
                { headers: { 'Authorization': `Bearer ${userInfo.token}` } }
            );
            const data = await response.json();
            if (response.ok) {
                setStats(data.data);
                setRecentCheckIns(data.data.recentCheckIns || []);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const handleScanQR = async (qrCode) => {
        if (loading) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/guests/scan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.token}`
                },
                body: JSON.stringify({ qrCode })
            });

            const data = await response.json();

            if (response.ok && data.data) {
                const guest = data.data.guest;
                if (guest.checkedIn) {
                    toast.warning(`${guest.firstName} already checked in!`);
                    setScannedGuest(null);
                } else {
                    setScannedGuest(guest);
                    setHeadcount(guest.expectedHeadcount || 1);
                    setNotes('');
                }
            } else {
                toast.error(data.error || 'Invalid QR code');
            }
        } catch (error) {
            toast.error('Failed to scan QR code');
        } finally {
            setLoading(false);
        }
    };

    const handleManualScan = () => {
        if (manualCode.trim()) {
            handleScanQR(manualCode.trim());
            setManualCode('');
            setShowManualInput(false);
        }
    };

    const handleConfirmCheckIn = async () => {
        if (!scannedGuest) return;

        setLoading(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/guests/${scannedGuest._id}/check-in`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${userInfo.token}`
                    },
                    body: JSON.stringify({
                        actualHeadcount: headcount,
                        notes
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {
                toast.success(`✓ ${scannedGuest.firstName} checked in with ${headcount} guest(s)!`);
                setScannedGuest(null);
                fetchStats();
            } else {
                toast.error(data.error || 'Check-in failed');
            }
        } catch (error) {
            toast.error('Failed to check in');
        } finally {
            setLoading(false);
        }
    };

    // Check if scanner is already running to avoid duplicates
    const scannerRef = useRef(null);

    useEffect(() => {
        // Only start scanner if we are NOT showing manual input and NOT showing a scanned guest
        if (!showManualInput && !scannedGuest) {
            // Give the DOM a moment to render the #qr-reader element
            const timer = setTimeout(() => {
                if (document.getElementById('qr-reader')) {
                    const html5QrcodeScanner = new window.Html5QrcodeScanner(
                        "qr-reader",
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        /* verbose= */ false
                    );

                    html5QrcodeScanner.render(
                        (decodedText) => {
                            // On Success
                            html5QrcodeScanner.clear();
                            handleScanQR(decodedText);
                        },
                        (errorMessage) => {
                            // On Error (ignore for now as it triggers on every frame without QR)
                        }
                    );
                    scannerRef.current = html5QrcodeScanner;
                }
            }, 100);

            return () => {
                clearTimeout(timer);
                if (scannerRef.current) {
                    try {
                        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
                    } catch (e) {
                        // ignore cleanup errors
                    }
                }
            };
        }
    }, [showManualInput, scannedGuest]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate(`/events/${eventId}/guests`)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white"
                    >
                        <ArrowLeft size="20" />
                        Back to Guests
                    </button>
                    <h1 className="text-lg font-bold">Check-In Scanner</h1>
                    <button
                        onClick={fetchStats}
                        className="p-2 text-gray-400 hover:text-white"
                    >
                        <Refresh2 size="20" />
                    </button>
                </div>
            </div>

            {/* Stats Banner */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4">
                <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-3xl font-bold">{stats.checkedInCount || 0}</div>
                        <div className="text-xs opacity-80">Checked In</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{stats.pendingCount || 0}</div>
                        <div className="text-xs opacity-80">Pending</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold">{stats.percentage || 0}%</div>
                        <div className="text-xs opacity-80">Complete</div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto p-4">
                {/* Scanned Guest Card */}
                {scannedGuest ? (
                    <div className="bg-white text-gray-900 rounded-2xl shadow-xl overflow-hidden mb-6">
                        {/* Guest Header */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-center">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <People size="40" variant="Bold" />
                            </div>
                            <h2 className="text-2xl font-bold">
                                {scannedGuest.firstName} {scannedGuest.lastName}
                            </h2>
                            <p className="opacity-80 capitalize">
                                {scannedGuest.side} side • {scannedGuest.guestType}
                            </p>
                        </div>

                        {/* Headcount Selector */}
                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Number of Guests Arriving
                            </label>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setHeadcount(Math.max(1, headcount - 1))}
                                    className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                                >
                                    <Minus size="24" />
                                </button>
                                <div className="text-4xl font-bold text-primary-600 w-20 text-center">
                                    {headcount}
                                </div>
                                <button
                                    onClick={() => setHeadcount(headcount + 1)}
                                    className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                                >
                                    <Add size="24" />
                                </button>
                            </div>
                            <p className="text-center text-sm text-gray-500 mt-2">
                                Expected: {scannedGuest.expectedHeadcount || 1}
                            </p>
                        </div>

                        {/* Notes */}
                        <div className="px-6 pb-6">
                            <input
                                type="text"
                                placeholder="Notes (optional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex border-t">
                            <button
                                onClick={handleCancelScan}
                                className="flex-1 py-4 flex items-center justify-center gap-2 text-gray-600 hover:bg-gray-50 border-r"
                            >
                                <CloseCircle size="24" />
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmCheckIn}
                                disabled={loading}
                                className="flex-1 py-4 flex items-center justify-center gap-2 bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                            >
                                <TickCircle size="24" variant="Bold" />
                                {loading ? 'Checking In...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Scanner Ready State */
                    <div className="text-center py-6">
                        {/* Camera Viewport */}
                        {!showManualInput && (
                            <div className="mb-6 relative bg-black rounded-2xl overflow-hidden aspect-square max-w-sm mx-auto shadow-2xl border-4 border-gray-700">
                                <div id="qr-reader" className="w-full h-full"></div>
                                {/* Overlay Styling override for html5-qrcode default ugliness */}
                                <style>{`
                                    #qr-reader { border: none !important; }
                                    #qr-reader__scan_region { img { display: none; } }
                                    #qr-reader__dashboard_section_csr button { 
                                        color: white; background: #ea580c; border: none; padding: 8px 16px; 
                                        border-radius: 8px; font-weight: bold; margin-top: 10px; cursor: pointer;
                                    }
                                `}</style>
                            </div>
                        )}

                        {!showManualInput ? (
                            <>
                                <h2 className="text-xl font-semibold mb-2">Scanning...</h2>
                                <p className="text-gray-400 mb-6">
                                    Point camera at a guest's QR code
                                </p>
                                <button
                                    onClick={() => setShowManualInput(true)}
                                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                                >
                                    Enter Code Manually
                                </button>
                            </>
                        ) : (
                            <div className="max-w-sm mx-auto">
                                <h2 className="text-xl font-semibold mb-4">Manual Entry</h2>
                                <div className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Enter QR code..."
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleManualScan}
                                        disabled={loading}
                                        className="px-4 py-3 bg-primary-600 rounded-lg hover:bg-primary-700"
                                    >
                                        Go
                                    </button>
                                </div>
                                <button
                                    onClick={() => setShowManualInput(false)}
                                    className="text-gray-400 hover:text-white text-sm"
                                >
                                    Switch back to Camera
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Recent Check-Ins */}
                {recentCheckIns.length > 0 && !scannedGuest && (
                    <div className="mt-8">
                        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-3">
                            Recent Check-Ins
                        </h3>
                        <div className="space-y-2">
                            {recentCheckIns.slice(0, 5).map((guest, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-gray-800 rounded-lg p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                            <TickCircle size="16" className="text-green-500" variant="Bold" />
                                        </div>
                                        <div>
                                            <div className="font-medium">
                                                {guest.firstName} {guest.lastName}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {guest.actualHeadcount || 1} guest(s)
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(guest.checkInTime).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CheckInScanner;
