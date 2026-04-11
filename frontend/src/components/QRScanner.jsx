import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, RefreshCw } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const scannerRef = useRef(null);
    // Unique ID for the scanner container to prevent double-mounting issues in React
    const scannerId = useRef(`reader-${Math.random().toString(36).substring(7)}`).current;
    const [isStarted, setIsStarted] = useState(false);

    useEffect(() => {
        // Delay initialization slightly to ensure DOM is ready and previous instances are cleared
        const timer = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                scannerId,
                {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    rememberLastUsedCamera: true,
                    supportedScanTypes: [0, 1] 
                },
                /* verbose= */ false
            );

            scanner.render(
                (decodedText) => {
                    onScan(decodedText);
                    scanner.clear().catch(err => console.error("Scanner clear error:", err));
                },
                (error) => {
                    // Ignore frame errors
                }
            );

            scannerRef.current = scanner;
            
            // Monitor if the scanner has effectively started (checking for the html5-qrcode video element)
            const checkInterval = setInterval(() => {
                const video = document.querySelector(`#${scannerId} video`);
                if (video) {
                    setIsStarted(true);
                    clearInterval(checkInterval);
                }
            }, 500);

            return () => clearInterval(checkInterval);
        }, 300);

        return () => {
            clearTimeout(timer);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => {
                    console.error("Cleanup error:", err);
                    // Manual DOM wipe as a last resort
                    const container = document.getElementById(scannerId);
                    if (container) container.innerHTML = "";
                });
            }
        };
    }, [scannerId]);

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-fade-in p-4 overflow-hidden">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-[110] bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isStarted ? 'bg-primary-500 animate-pulse' : 'bg-secondary-500'}`} />
                    <span className="text-sm font-medium tracking-widest uppercase text-white">
                        {isStarted ? 'Live Scanner' : 'Initialzing...'}
                    </span>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90 text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="glass-card w-full max-w-lg overflow-hidden relative animate-scale-in p-4 mt-8 flex flex-col items-center">
                {/* The unique ID'd container prevents the "2 cameras" bug */}
                <div id={scannerId} className="w-full rounded-xl overflow-hidden qr-container-professional" />
                
                {!isStarted && (
                    <div className="py-8 flex flex-col items-center gap-4 animate-pulse">
                        <Camera className="w-12 h-12 text-primary-500 opacity-20" />
                        <p className="text-secondary-400 text-sm">Setting up secure lens...</p>
                    </div>
                )}

                <div className="mt-4 flex flex-col items-center gap-2">
                    <p className="text-[10px] text-campus-muted text-center uppercase tracking-wide">
                        Detection Area: Square Center
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" /> Not working? Refresh Page
                    </button>
                </div>
            </div>

            {/* Custom Styles to make the default scanner look high-end */}
            <style dangerouslySetInnerHTML={{ __html: `
                #${scannerId} { 
                    border: none !important; 
                    padding: 0 !important; 
                    background: transparent !important;
                }
                #${scannerId} img { display: none !important; }
                #${scannerId}__scan_region { 
                    background: transparent !important; 
                    border-radius: 12px !important;
                    overflow: hidden !important;
                }
                #${scannerId}__dashboard_section_csr button {
                    background: #4f46e5 !important;
                    color: white !important;
                    border: none !important;
                    padding: 12px 24px !important;
                    border-radius: 12px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    margin: 10px 0 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 1px !important;
                    font-size: 11px !important;
                    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4) !important;
                    transition: all 0.2s ease !important;
                }
                #${scannerId}__dashboard_section_csr button:hover {
                    background: #4338ca !important;
                    transform: translateY(-1px) !important;
                }
                #${scannerId}__dashboard_section_csr {
                    padding: 15px 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    background: transparent !important;
                }
                #${scannerId}__status_span { display: none !important; }
                #${scannerId}__camera_selection {
                    background: #1a1a2e !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 10px !important;
                    padding: 10px !important;
                    margin-bottom: 5px !important;
                    width: 100% !important;
                    outline: none !important;
                    font-size: 13px !important;
                }
            `}} />
        </div>
    );
}
