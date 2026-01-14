import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ShieldCheck, AlertCircle, ShoppingBag, User } from 'lucide-react';
import axios from 'axios';

const StaffScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "staff-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(async (decodedText) => {
            setLoading(true);
            try {
                // In a real app, you'd verify the txn on the server
                // response = await axios.get(`http://localhost:5000/api/verify-exit/${decodedText}`);
                // For demo, we just simulate successful verification
                setScanResult({
                    txnId: decodedText,
                    status: 'verified',
                    items: 4,
                    amount: 15200,
                    customer: 'John Doe'
                });
            } catch (err) {
                setScanResult({ status: 'error', message: 'Invalid Transaction ID' });
            } finally {
                setLoading(false);
            }
        });

        return () => {
            scanner.clear().catch(err => console.error(err));
        };
    }, []);

    return (
        <div className="animate-fade-in" style={{ padding: '24px' }}>
            <header className="header" style={{ padding: '0 0 24px 0' }}>
                <div className="logo" style={{ color: 'var(--primary)' }}>STAFF PORTAL</div>
            </header>

            <div className="glass-card" style={{ marginBottom: '24px' }}>
                <h2 className="section-title">Exit Validation</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                    Scan the customer's checkout QR code to verify payment and items.
                </p>
                <div id="staff-reader" style={{ borderRadius: '16px', overflow: 'hidden' }}></div>
            </div>

            {scanResult && (
                <div className="glass-card animate-fade-in" style={{ border: scanResult.status === 'verified' ? '2px solid var(--success)' : '2px solid var(--error)' }}>
                    {scanResult.status === 'verified' ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)', marginBottom: '16px' }}>
                                <ShieldCheck size={24} />
                                <span style={{ fontWeight: '700', fontSize: '18px' }}>Valid Checkout</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Customer</span>
                                    <span>{scanResult.customer}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Items Count</span>
                                    <span style={{ fontWeight: '600' }}>{scanResult.items} Items</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Amount Paid</span>
                                    <span style={{ fontWeight: '700' }}>₦{scanResult.amount.toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '20px', background: 'var(--success)' }}
                                onClick={() => setScanResult(null)}
                            >
                                Clear & Scan Next
                            </button>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--error)' }}>
                            <AlertCircle size={48} style={{ marginBottom: '16px' }} />
                            <h3>Verification Failed</h3>
                            <p>{scanResult.message}</p>
                            <button className="btn btn-secondary" onClick={() => setScanResult(null)} style={{ marginTop: '16px' }}>Retry</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StaffScanner;
