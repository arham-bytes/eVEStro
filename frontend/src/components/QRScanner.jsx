import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Zap, ZapOff, Loader2 } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const scannerRef = useRef(null);
    const containerId = 'professional-reader';

    useEffect(() => {
        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const startScanner = async () => {
            try {
                const config = { 
                    fps: 15, 
                    qrbox: { width: 250, height: 250 },
                };

                await html5QrCode.start(
                    { facingMode: "environment" }, // Prioritize back camera
                    config,
                    (decodedText) => {
                        onScan(decodedText);
                        stopScanner();
                    },
                    (errorMessage) => {
                        // Silent frame scanning errors
                    }
                );

                setIsCameraReady(true);

                // Check if torch (flash) is available
                const track = html5QrCode.getRunningTrack();
                if (track && track.getCapabilities()?.torch) {
                    setHasTorch(true);
                }
            } catch (err) {
                console.error("Camera start error:", err);
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
                
                {/* Loading State */}
                {!isCameraReady && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-4">
                        <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                        <p className="text-secondary-400 font-medium">Initializing back camera...</p>
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
