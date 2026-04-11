import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
    const scannerRef = useRef(null);
    const SCANNER_ID = 'reader';

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            SCANNER_ID,
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: true,
            },
            /* verbose= */ false
        );

        scanner.render(
            (decodedText) => {
                // Success
                onScan(decodedText);
                // The caller should ideally handle closing the modal, but we can also clear here
                scanner.clear().catch(err => console.error("Failed to clear scanner", err));
            },
            (errorMessage) => {
                // We don't usually alert on every frame error
                // console.log(errorMessage);
            }
        );

        scannerRef.current = scanner;

        // Cleanup on unmount
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch((error) => console.error("Failed to clear scanner on unmount", error));
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md overflow-hidden relative animate-scale-in">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="font-semibold">Scan Ticket QR</h3>
                    <button 
                        onClick={() => {
                            if (scannerRef.current) {
                                scannerRef.current.clear().then(() => onClose()).catch(onClose);
                            } else {
                                onClose();
                            }
                        }}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4">
                    <div id={SCANNER_ID} className="rounded-xl overflow-hidden bg-black/20" />
                    <p className="mt-4 text-sm text-campus-muted text-center">
                        Position the QR code within the frame to scan
                    </p>
                </div>
            </div>
        </div>
    );
}
