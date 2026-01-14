import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Scan, MapPin } from 'lucide-react';
import axios from 'axios';

const EntranceScanner = ({ onOutletDetected }) => {
    const navigate = useNavigate();
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "entrance-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(async (decodedText) => {
            try {
                // Assume decodedText is the outlet ID (e.g., 'imo-central')
                const response = await axios.get(`http://localhost:5000/api/outlets/${decodedText}`);
                onOutletDetected(response.data);
                scanner.clear();

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
        }, (error) => {
            // console.warn(error);
        });

        return () => {
            // Clean up scanner if needed, though scanner.clear() handles most cases
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

                <div id="entrance-reader" style={{ borderRadius: '16px', overflow: 'hidden' }}></div>

                <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    <MapPin size={16} />
                    <span>Imo State, Nigeria</span>
                </div>
            </div>
        </div>
    );
};

export default EntranceScanner;
