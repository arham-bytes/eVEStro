import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const scannerRef = useRef(null);
    const SCANNER_ID = 'reader';

    useEffect(() => {
        // One-shot fix for double camera and initialization issues
        const container = document.getElementById(SCANNER_ID);
        if (container) {
            container.innerHTML = ""; // Force clear before any initialization
        }

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
            (error) => {
                // Ignore frame errors
            }
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(err => {
                    console.error("Cleanup error:", err);
                    // If clear fails, manually wipe the DOM so next mount is clean
                    if (container) container.innerHTML = "";
                });
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-fade-in p-4">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-[110] bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium tracking-widest uppercase text-white">Security Scanner</span>
                </div>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90 text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <div className="glass-card w-full max-w-lg overflow-hidden relative animate-scale-in p-2 mt-12">
                <div id={SCANNER_ID} className="rounded-xl overflow-hidden" />
                
                <p className="mt-4 text-xs text-campus-muted text-center pb-4">
                    Position the QR code inside the frame. <br/>
                    <span className="opacity-60 italic mt-1 block">Works best in Chrome Browser</span>
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
                    padding: 12px 24px !important;
                    border-radius: 12px !important;
                    font-weight: 600 !important;
                    cursor: pointer !important;
                    margin: 10px 0 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 1px !important;
                    font-size: 11px !important;
                    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.4) !important;
                }
                #reader__dashboard_section_csr {
                    padding: 20px !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                }
                #reader__status_span { display: none !important; }
                #reader__camera_selection {
                    background: #1a1a2e !important;
                    color: white !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    border-radius: 10px !important;
                    padding: 10px !important;
                    margin-bottom: 12px !important;
                    width: 100% !important;
                    outline: none !important;
                }
            `}} />
        </div>
    );
}
