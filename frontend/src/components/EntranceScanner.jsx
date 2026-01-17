import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Scan, MapPin, X } from 'lucide-react';
import axios from 'axios';

const EntranceScanner = ({ onOutletDetected }) => {
    const navigate = useNavigate();
    const scannerRef = useRef(null);

    const API_BASE = '/api';

    useEffect(() => {
        const scanner = new Html5Qrcode("entrance-reader");
        const config = {
            fps: 20,
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        };

        scanner.start(
            { facingMode: "environment" },
            config,
            async (decodedText) => {
                try {
                    // Assume decodedText is the outlet ID (e.g., 'imo-central')
                    const response = await axios.get(`${API_BASE}/outlets/${decodedText}`);

                    // Visual feedback
                    const feedback = document.createElement('div');
                    feedback.className = 'scan-success-flash';
                    document.body.appendChild(feedback);
                    setTimeout(() => feedback.remove(), 500);

                    onOutletDetected(response.data);

                    if (scanner.isScanning()) {
                        await scanner.stop();
                    }

                    const user = localStorage.getItem('shopper_user');
                    if (user) {
                        navigate('/shop');
                    } else {
                        navigate('/signup');
                    }
                } catch (err) {
                    console.error("Outlet not found", err);
                    alert("Invalid Store QR Code. Please scan the QR at the entrance.");
                }
            },
            (error) => {
                // console.warn(error); // Optional: log scan failures
            }
        ).catch(err => console.error("Scanner failed to start or encountered an error:", err));

        return () => {
            if (scanner.isScanning()) {
                scanner.stop().catch(e => console.error("Error stopping scanner:", e));
            }
        };
    }, []);

    return (
        <div className="animate-fade-in" style={{ padding: '24px' }}>
            <header className="header" style={{ padding: '0 0 40px 0' }}>
                <div className="logo">PRICELESS</div>
            </header>

            <div className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Scan size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                    <h1 className="section-title">Welcome Shopper</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Please scan the QR code at the entrance of this store to begin your shopping experience.
                    </p>
                </div>

                <div style={{ position: 'relative' }}>
                    <div id="entrance-reader" style={{ borderRadius: '24px', overflow: 'hidden', height: '300px' }}></div>
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '250px', height: '250px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '32px', position: 'relative' }}>
                            <div className="scanner-laser"></div>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <MapPin size={16} />
                    <span>Imo State, Nigeria</span>
                </div>
            </div>
        </div>
    );
};

export default EntranceScanner;
