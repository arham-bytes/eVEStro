import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, RefreshCw, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const [isStarted, setIsStarted] = useState(false);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const scannerId = "qr-reader-container";

    useEffect(() => {
        // Initialize the scanner object
        const html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        const startScanner = async () => {
            try {
                // 1. Check for Secure Context (HTTPS requirement)
                if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    throw new Error("Camera access is blocked by your browser because this site is not using HTTPS. Please use a secure connection.");
                }

                const config = { 
                    fps: 15, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };
                
                // 2. Start the camera with back-camera preference
                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    config,
                    (decodedText) => {
                        // Success callback
                        onScan(decodedText);
                        // We close automatically on scan success via the parent
                    },
                    (errorMessage) => {
                        // Scanning... (ignore frame-by-frame errors)
                    }
                );
                
                setIsStarted(true);
            } catch (err) {
                console.error("Scanner Error:", err);
                let friendlyMessage = "Could not access camera.";
                
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    friendlyMessage = "Camera permission denied. Please allow camera access in your browser settings.";
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    friendlyMessage = "No camera found on this device.";
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    friendlyMessage = "Camera is already in use by another application.";
                } else {
                    friendlyMessage = err.message || "Failed to initialize camera.";
                }
                
                setError(friendlyMessage);
            }
        };

        // Give React a tiny bit of time to paint the div
        const timer = setTimeout(startScanner, 500);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(e => console.error("Could not stop scanning", e));
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-[#050508] z-[100] flex flex-col items-center justify-center animate-fade-in p-4 overflow-hidden">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-[110] bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isStarted ? 'bg-primary-500 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.8)]' : 'bg-red-500'}`} />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/90">
                        {isStarted ? 'Vision Scanner Active' : 'System Setup'}
                    </span>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white/5 hover:bg-white/15 rounded-full border border-white/10 transition-all active:scale-95 text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="w-full max-w-lg relative animate-scale-in">
                {/* Scanner Frame */}
                <div className="relative glass-card border-primary-500/30 overflow-hidden shadow-2xl">
                    <div id={scannerId} className="w-full aspect-square bg-black flex items-center justify-center overflow-hidden" />
                    
                    {/* Visual Overlay for the Box */}
                    {isStarted && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-[250px] h-[250px] border-2 border-primary-500/50 rounded-3xl shadow-[0_0_0_4000px_rgba(0,0,0,0.5)] relative">
                                {/* Corner Accents */}
                                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary-400 rounded-tl-xl" />
                                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary-400 rounded-tr-xl" />
                                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary-400 rounded-bl-xl" />
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary-400 rounded-br-xl" />
                                
                                {/* Scanning Line Animation */}
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-primary-500/80 shadow-[0_0_15px_#4f46e5] animate-[scan_2s_linear_infinite]" />
                            </div>
                        </div>
                    )}

                    {/* States */}
                    {!isStarted && !error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/90">
                            <div className="relative">
                                <Camera className="w-16 h-16 text-primary-500/20" />
                                <div className="absolute inset-0 border-2 border-primary-500/40 rounded-full animate-ping" />
                            </div>
                            <p className="text-secondary-400 text-sm font-medium animate-pulse">Requesting Camera Access...</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/95 p-8 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-2">
                                {error.includes("HTTPS") ? <ShieldAlert className="w-8 h-8 text-red-500" /> : <AlertTriangle className="w-8 h-8 text-red-500" />}
                            </div>
                            <h3 className="text-white font-bold">Access Interrupted</h3>
                            <p className="text-red-400/80 text-sm leading-relaxed max-w-[250px]">
                                {error}
                            </p>
                            <button 
                                onClick={() => window.location.reload()}
                                className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold border border-white/10 transition-all"
                            >
                                RETRY CONNECTION
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="mt-8 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-evestro-muted uppercase tracking-widest mb-1">Status</span>
                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${isStarted ? 'text-green-400 border-green-500/30 bg-green-500/5' : 'text-red-400 border-red-500/30 bg-red-500/5'}`}>
                                {isStarted ? 'ENCRYPTED' : 'OFFLINE'}
                            </span>
                        </div>
                        <div className="w-[1px] h-8 bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-evestro-muted uppercase tracking-widest mb-1">Mode</span>
                            <span className="text-[10px] font-bold text-primary-400 border border-primary-500/30 bg-primary-500/5 px-3 py-1 rounded-full">
                                REAR_LENS
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="text-evestro-muted/60 hover:text-white transition-colors text-xs flex items-center gap-2"
                    >
                        <RefreshCw className="w-3 h-3" /> Still not working? Use Manual Entry
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                #${scannerId} video {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                    border-radius: 12px;
                }
            `}} />
        </div>
    );
}
