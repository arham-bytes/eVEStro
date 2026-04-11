import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Zap, ZapOff, Loader2, CameraOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [error, setError] = useState(null);
    const scannerRef = useRef(null);
    const containerId = 'professional-reader';

    useEffect(() => {
        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const startScanner = async () => {
            setError(null);
            setIsCameraReady(false);
            
            try {
                const config = { 
                    fps: 15, 
                    qrbox: { width: 250, height: 250 },
                };

                // Add a small delay for smoother initialization on Android
                await new Promise(resolve => setTimeout(resolve, 500));

                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(containerId);
                }

                await scannerRef.current.start(
                    { facingMode: "environment" }, // Using ideal strategy implicitly
                    config,
                    (decodedText) => {
                        onScan(decodedText);
                    },
                    (errorMessage) => {
                        // Silent frame scanning errors
                    }
                );

                setIsCameraReady(true);

                const track = scannerRef.current.getRunningTrack();
                if (track && track.getCapabilities()?.torch) {
                    setHasTorch(true);
                }
            } catch (err) {
                console.error("Camera start error:", err);
                let userFriendlyError = 'Could not access camera.';
                
                if (err?.name === 'NotAllowedError') {
                    userFriendlyError = 'Please allow camera permissions to scan tickets.';
                } else if (err?.name === 'NotFoundError') {
                    userFriendlyError = 'No back camera found on this device.';
                } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                    userFriendlyError = 'Camera requires a secure HTTPS connection.';
                }

                setError(userFriendlyError);
                setIsCameraReady(false);
            }
        };

        const stopScanner = async () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                try {
                    await scannerRef.current.stop();
                } catch (err) {
                    console.error("Failed to stop scanner", err);
                }
            }
        };

        startScanner();

        return () => {
            stopScanner();
        };
    }, []);

    const toggleTorch = async () => {
        if (!scannerRef.current) return;
        const track = scannerRef.current.getRunningTrack();
        if (track && track.getCapabilities()?.torch) {
            try {
                await track.applyConstraints({
                    advanced: [{ torch: !isTorchOn }]
                });
                setIsTorchOn(!isTorchOn);
            } catch (err) {
                console.error("Torch toggle error:", err);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-between animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="w-full p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium tracking-widest uppercase">Live Ticket Scanner</span>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Scanner Area */}
            <div className="relative flex-1 w-full flex items-center justify-center">
                {/* Camera Feed */}
                <div id={containerId} className="absolute inset-0 w-full h-full object-cover" />
                
                {/* Loading / Error State */}
                {!isCameraReady && !error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-4 px-10 text-center">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                        <p className="text-secondary-400 font-medium">Initializing back camera...</p>
                        <p className="text-xs text-campus-muted mt-2">Make sure to allow camera permissions if prompted</p>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-6 px-8 text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                            <CameraOff className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Camera Error</h3>
                            <p className="text-sm text-campus-muted max-w-xs mx-auto">
                                {error}
                            </p>
                        </div>
                        <button 
                            onClick={() => window.location.reload()}
                            className="btn-primary flex items-center gap-2 text-sm"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh Page
                        </button>
                    </div>
                )}

                {/* Professional Overlay */}
                {isCameraReady && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Semi-transparent Backdrop with Hole */}
                        <div className="absolute inset-0 border-[60px] md:border-[150px] border-black/60" />

                        {/* Scan Box Brackets */}
                        <div className="relative w-[250px] h-[250px] md:w-[350px] md:h-[350px]">
                            {/* Brackets */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg" />

                            {/* Laser Line */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary-500 shadow-[0_0_15px_rgba(67,56,202,0.8)] animate-scan" />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            <div className="w-full p-10 flex flex-col items-center gap-6 z-10 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-campus-muted text-sm text-center px-6">
                    Place the ticket QR code inside the frame to scan automatically
                </p>
                
                {hasTorch && (
                    <button 
                        onClick={toggleTorch}
                        className={`p-5 rounded-full transition-all duration-300 ${isTorchOn ? 'bg-primary-500 shadow-lg shadow-primary-500/40' : 'bg-white/10'}`}
                    >
                        {isTorchOn ? <ZapOff className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                    </button>
                )}
            </div>
        </div>
    );
}
