import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Zap, ZapOff, Loader2, CameraOff, RefreshCw, AlertCircle, ImagePlus, Copy, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRScanner({ onScan, onClose }) {
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [hasTorch, setHasTorch] = useState(false);
    const [error, setError] = useState(null);
    const [cameras, setCameras] = useState([]);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
    const [showStartButton, setShowStartButton] = useState(false);
    const scannerRef = useRef(null);
    const fileInputRef = useRef(null);
    const containerId = 'professional-reader';
    const isGoogleApp = /GSA/i.test(navigator.userAgent);

    useEffect(() => {
        const html5QrCode = new Html5Qrcode(containerId);
        scannerRef.current = html5QrCode;

        const startScanner = async (cameraIndex = 0) => {
            setError(null);
            setIsCameraReady(false);
            
            try {
                // Ensure existing scanner is stopped before starting new one
                if (scannerRef.current && scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }

                if (!scannerRef.current) {
                    scannerRef.current = new Html5Qrcode(containerId);
                }

                // Explicitly request permissions first (sometimes wakes up camera better)
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                    stream.getTracks().forEach(track => track.stop()); // Stop immediately, just needed permission
                } catch (pErr) {
                    console.warn("Permission check failed, proceeding anyway", pErr);
                }

                const devices = await Html5Qrcode.getCameras();
                if (!devices || devices.length === 0) {
                    throw { name: 'NotFoundError' };
                }
                setCameras(devices);

                let cameraId = devices[cameraIndex].id;
                if (cameraIndex === 0) {
                    const backCamera = devices.find(d => 
                        d.label.toLowerCase().includes('back') || 
                        d.label.toLowerCase().includes('environment') || 
                        d.label.toLowerCase().includes('rear')
                    );
                    if (backCamera) {
                        cameraId = backCamera.id;
                        setCurrentCameraIndex(devices.indexOf(backCamera));
                    }
                }

                const config = { 
                    fps: 15, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                };

                await scannerRef.current.start(
                    cameraId,
                    config,
                    (decodedText) => {
                        onScan(decodedText);
                    },
                    (errorMessage) => {}
                );

                setIsCameraReady(true);
                setShowStartButton(false);

                const track = scannerRef.current.getRunningTrack();
                if (track && track.getCapabilities()?.torch) {
                    setHasTorch(true);
                }
            } catch (err) {
                console.error("Camera start error:", err);
                let userFriendlyError = 'Could not access camera.';
                
                if (err?.name === 'NotAllowedError' || err === 'NotAllowedError') {
                    userFriendlyError = 'Camera permission denied. Please allow camera access in your browser settings.';
                } else if (err?.name === 'NotFoundError') {
                    userFriendlyError = 'No camera found on this device.';
                } else if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
                    userFriendlyError = 'Camera requires a secure HTTPS connection.';
                } else if (navigator.userAgent.match(/FBAN|FBAV|Instagram|LinkedIn|WhatsApp/i)) {
                    userFriendlyError = 'You are using an In-App browser which blocks cameras. Please open this link in Chrome or Safari.';
                } else {
                    userFriendlyError = 'Browser blocked camera access. Try clicking "Start Camera" or Refresh.';
                    setShowStartButton(true);
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

    const switchCamera = () => {
        if (cameras.length < 2) return;
        const nextIndex = (currentCameraIndex + 1) % cameras.length;
        setCurrentCameraIndex(nextIndex);
        startScanner(nextIndex);
    };

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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (!scannerRef.current) {
                scannerRef.current = new Html5Qrcode(containerId);
            }
            
            // If already scanning, we should stop but html5-qrcode's scanFile 
            // works independently if the container is initialized.
            toast.loading('Scanning image...', { id: 'file-scan' });
            
            const decodedText = await scannerRef.current.scanFileV2(file, false);
            toast.success('QR Code detected!', { id: 'file-scan' });
            onScan(decodedText.decodedText);
        } catch (err) {
            console.error("File scan error:", err);
            toast.error('Could not find a valid QR code in this image.', { id: 'file-scan' });
        }
    };

    const copyUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied! Now paste it in Chrome.');
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
                        <div className="flex flex-col gap-3 w-full">
                            {isGoogleApp && (
                                <div className="mb-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3 text-left">
                                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-blue-300 leading-tight">
                                        You are in the <b>Google Search App</b>. This app blocks camera access. 
                                        Please click "Copy Link" and paste it into the <b>Chrome</b> app.
                                    </p>
                                </div>
                            )}
                            
                            <button 
                                onClick={() => startScanner(currentCameraIndex)}
                                className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5"
                            >
                                <RefreshCw className={`w-4 h-4 ${!error ? 'animate-spin' : ''}`} /> {error ? 'Try Again' : 'Reloading...'}
                            </button>

                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                            >
                                <ImagePlus className="w-4 h-4" /> Upload QR Photo
                            </button>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <button 
                                    onClick={copyUrl}
                                    className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg py-2 text-[10px] flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <Copy className="w-3 h-3" /> Copy Link
                                </button>
                                <button 
                                    onClick={() => window.location.reload()}
                                    className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg py-2 text-[10px] flex items-center justify-center gap-1.5 transition-all"
                                >
                                    <ExternalLink className="w-3 h-3" /> Refresh
                                </button>
                            </div>
                        </div>
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
                
                <div className="flex items-center gap-6">
                    {cameras.length > 1 && (
                        <button 
                            onClick={switchCamera}
                            className="p-5 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90"
                            title="Switch Camera"
                        >
                            <RefreshCw className="w-6 h-6" />
                        </button>
                    )}

                    {hasTorch && (
                        <button 
                            onClick={toggleTorch}
                            className={`p-5 rounded-full transition-all duration-300 ${isTorchOn ? 'bg-primary-500 shadow-lg shadow-primary-500/40' : 'bg-white/10'}`}
                        >
                            {isTorchOn ? <ZapOff className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                        </button>
                    )}

                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-5 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90"
                        title="Upload Photo"
                    >
                        <ImagePlus className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
                capture="environment" 
            />
        </div>
    );
}
