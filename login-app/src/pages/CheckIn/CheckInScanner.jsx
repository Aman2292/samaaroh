import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Refresh2, People, Add, Minus, CloseCircle, TickCircle } from 'iconsax-react';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../config/api';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

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
    const [cameraError, setCameraError] = useState(null);

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
        // Haptic feedback for instant feel
        if (navigator.vibrate) navigator.vibrate(200);

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

    const handleCancelScan = () => {
        setScannedGuest(null);
        setHeadcount(1);
        setNotes('');
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

    // Use a ref to hold the running instance so we can stop it easily
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        // Only start scanner if we are NOT showing manual input and NOT showing a scanned guest
        if (!showManualInput && !scannedGuest) {
            const startScanner = async () => {
                // Wait for the DOM element #qr-reader to be available
                await new Promise(r => setTimeout(r, 100));

                if (!document.getElementById('qr-reader')) return;

                // Create instance if not exists
                if (!html5QrCodeRef.current) {
                    html5QrCodeRef.current = new Html5Qrcode("qr-reader");
                }

                const html5QrCode = html5QrCodeRef.current;

                try {
                    // Check if already scanning
                    if (html5QrCode.isScanning) {
                        await html5QrCode.stop();
                    }

                    await html5QrCode.start(
                        { facingMode: "environment" },
                        {
                            fps: 20,
                            qrbox: { width: 280, height: 280 },
                            aspectRatio: 1.0,
                            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                        },
                        (decodedText) => {
                            // OPTIMIZATION: Don't stop here explicitly. 
                            // Just processing the data triggers state change -> unmount/cleanup -> which handles stop()
                            // This avoids the "Cannot clear while scan is ongoing" race condition.
                            handleScanQR(decodedText);
                        },
                        (errorMessage) => {
                            // Parse error, ignore
                        }
                    );
                    setCameraError(null);
                } catch (err) {
                    console.error("Scanner Error:", err);
                    setCameraError("Could not access camera. Please check permissions.");
                }
            };

            startScanner();

            return () => {
                if (html5QrCodeRef.current) {
                    const scanner = html5QrCodeRef.current;
                    try {
                        if (scanner.isScanning) {
                            scanner.stop()
                                .then(() => {
                                    scanner.clear().catch(() => { });
                                })
                                .catch(err => {
                                    console.error("Failed to stop scanner on cleanup", err);
                                });
                        } else {
                            // Only clear if not scanning to avoid error
                            scanner.clear().catch(() => { });
                        }
                    } catch (e) {
                        // ignore cleanup errors
                    }
                }
            };
        }
    }, [showManualInput, scannedGuest]);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
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
            <div className="max-w-md mx-auto p-4 relative">
                {/* Scanner View */}
                {!scannedGuest && !showManualInput && (
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-800 bg-black">
                        {cameraError ? (
                            <div className="flex flex-col items-center justify-center aspect-square p-6 text-center">
                                <CloseCircle size="48" className="text-red-500 mb-4" variant="Bold" />
                                <p className="text-red-200">{cameraError}</p>
                            </div>
                        ) : (
                            <div className="relative aspect-[3/4]">
                                <div id="qr-reader" className="w-full h-full object-cover"></div>
                                {/* Custom Overlay - NOW THIS WILL BE THE ONLY ONE */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-64 h-64 border-2 border-primary-500/50 rounded-3xl relative">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-2xl"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-2xl"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-2xl"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-2xl"></div>
                                        {/* Scanning Line Animation */}
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary-400 shadow-[0_0_15px_rgba(234,88,12,0.8)] animate-scan-fast opacity-80"></div>
                                    </div>
                                    <p className="absolute bottom-8 left-0 right-0 text-center text-sm font-medium text-white/80 bg-black/40 py-2 backdrop-blur-sm">
                                        Point camera at QR code
                                    </p>
                                </div>
                                <style>{`
                                    #qr-reader video { object-fit: cover; border-radius: 1.5rem; }
                                    #qr-reader canvas, 
                                    #qr-reader__scan_region, 
                                    #qr-reader__dashboard_section_csr { 
                                        display: none !important; 
                                    }
                                    @keyframes scan-fast {
                                        0% { top: 10%; opacity: 0; }
                                        10% { opacity: 1; }
                                        90% { opacity: 1; }
                                        100% { top: 90%; opacity: 0; }
                                    }
                                    .animate-scan-fast {
                                        animation: scan-fast 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                                    }
                                `}</style>
                            </div>
                        )}
                    </div>
                )}

                {/* Manual Input Logic */}
                {showManualInput && (
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

                {/* Scanned Guest Card */}
                {scannedGuest && (
                    <div className="bg-white text-gray-900 rounded-2xl shadow-xl overflow-hidden mb-6 animate-fade-in-up">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

                            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white/30 shadow-lg">
                                <People size="40" variant="Bold" />
                            </div>
                            <h2 className="text-2xl font-bold relative z-10">
                                {scannedGuest.firstName} {scannedGuest.lastName}
                            </h2>
                            <p className="opacity-90 capitalize font-medium relative z-10">
                                {scannedGuest.side} side • {scannedGuest.guestType}
                            </p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3 text-center uppercase tracking-wider">
                                Guest Count
                            </label>
                            <div className="flex items-center justify-center gap-6">
                                <button
                                    onClick={() => setHeadcount(Math.max(1, headcount - 1))}
                                    className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"
                                >
                                    <Minus size="24" className="text-gray-600" />
                                </button>
                                <div className="text-5xl font-bold text-gray-800 w-24 text-center">
                                    {headcount}
                                </div>
                                <button
                                    onClick={() => setHeadcount(headcount + 1)}
                                    className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center hover:bg-gray-200 transition-colors shadow-sm"
                                >
                                    <Add size="24" className="text-gray-600" />
                                </button>
                            </div>
                            <p className="text-center text-sm text-gray-400 mt-3 font-medium">
                                Expected: <span className="text-gray-600">{scannedGuest.expectedHeadcount || 1}</span>
                            </p>
                        </div>

                        <div className="px-6 pb-6">
                            <input
                                type="text"
                                placeholder="Add notes (optional)..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all outline-none"
                            />
                        </div>

                        <div className="flex border-t border-gray-100">
                            <button
                                onClick={handleCancelScan}
                                className="flex-1 py-5 flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 font-semibold border-r border-gray-100 transition-colors"
                            >
                                <CloseCircle size="24" />
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmCheckIn}
                                disabled={loading}
                                className="flex-1 py-5 flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 font-bold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <TickCircle size="24" variant="Bold" />
                                {loading ? 'Processing...' : 'Check In'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Scanner Manual Button (Only show if not scanning guest and camera active) */}
                {!scannedGuest && !showManualInput && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setShowManualInput(true)}
                            className="px-6 py-3 bg-gray-800/50 backdrop-blur border border-gray-700 text-white rounded-xl hover:bg-gray-800 transition-all font-medium"
                        >
                            Enter Code Manually
                        </button>
                    </div>
                )}

                {/* Recent Check-Ins */}
                {recentCheckIns.length > 0 && !scannedGuest && !showManualInput && (
                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {recentCheckIns.slice(0, 5).map((guest, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between bg-gray-900/50 border border-gray-800 rounded-xl p-4 backdrop-blur-sm"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                                            <TickCircle size="20" className="text-green-500" variant="Bold" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white">
                                                {guest.firstName} {guest.lastName}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {guest.actualHeadcount || 1} guest(s) • {guest.guestType}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-medium text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                        {new Date(guest.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
