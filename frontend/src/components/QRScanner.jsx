import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const scannerRef = useRef(null);
    const SCANNER_ID = 'reader';

    const isRendering = useRef(false);

    useEffect(() => {
        if (isRendering.current) return;
        isRendering.current = true;

        // Initialize scanner using the reliable high-level scanner
        const scanner = new Html5QrcodeScanner(
            SCANNER_ID,
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
            (error) => {}
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().then(() => {
                    isRendering.current = false;
                }).catch(err => {
                    console.error("Cleanup error:", err);
                    isRendering.current = false;
                });
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-fade-in sm:p-4">
            {/* Custom Header Overlay */}
            <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-[110] bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium tracking-widest uppercase">Professional Scanner</span>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="glass-card w-full max-w-lg overflow-hidden relative animate-scale-in p-2">
                {/* 
                  We apply CSS overrides in index.css (or inline style) to style the internal 
                  buttons of html5-qrcode-scanner to match our theme.
                */}
                <div id={SCANNER_ID} className="rounded-xl overflow-hidden qr-scanner-wrapper" />
                
                <p className="mt-4 text-xs text-campus-muted text-center pb-4">
                    Position the QR code inside the frame. <br/>
                    <span className="opacity-60 italic mt-1 block">Works best in Chrome or Safari</span>
                </p>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                #reader { border: none !important; padding: 0 !important; }
                #reader img { display: none !important; }
                #reader__scan_region { background: transparent !important; }
                #reader__dashboard_section_csr button {
                    background: linear-gradient(to right, #4f46e5, #6366f1) !important;
                    color: white !important;
                    border: none !important;
                    padding: 10px 20px !important;
                    border-radius: 12px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    margin: 10px 0 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 1px !important;
                    font-size: 12px !important;
                }
                #reader__dashboard_section_csr {
                    padding: 20px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                }
                #reader__status_span { display: none !important; }
                #reader__camera_selection {
                    background: #1e1e3f !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 8px !important;
                    padding: 8px !important;
                    margin-bottom: 10px !important;
                    width: 100% !important;
                }
            `}} />
        </div>
    );
}
