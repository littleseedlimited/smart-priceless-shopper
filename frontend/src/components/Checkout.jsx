import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, CheckCircle2, QrCode, Download, ExternalLink } from 'lucide-react';
import axios from 'axios';

const Checkout = ({ user, outlet }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paid, setPaid] = useState(false);
    const [exitQr, setExitQr] = useState(null);

    const cart = JSON.parse(localStorage.getItem('shopper_cart') || '[]');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (tg && !paid) {
            tg.MainButton.text = `PAY ₦${total.toLocaleString()}`;
            tg.MainButton.show();
            tg.MainButton.onClick(handlePayment);
        }
        return () => tg?.MainButton.hide();
    }, [total, paid]);

    const handlePayment = async () => {
        setLoading(true);
        const tg = window.Telegram?.WebApp;
        if (tg) tg.MainButton.showProgress();

        try {
            // Simulate API call to process payment
            const response = await axios.post('http://localhost:5000/api/checkout', {
                userId: user?.id,
                outletId: outlet?.id,
                items: cart,
                totalAmount: total,
                paymentMethod: 'card'
            });

            setExitQr(response.data.exitQrCode);
            setPaid(true);
            localStorage.removeItem('shopper_cart');
        } catch (err) {
            console.error(err);
            alert("Payment failed. Please check your card or network.");
        } finally {
            setLoading(false);
            if (tg) tg.MainButton.hideProgress();
        }
    };

    if (paid) {
        return (
            <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', minHeight: '100vh', textAlign: 'center' }}>
                <header className="header" style={{ padding: '0 0 30px 0' }}>
                    <div className="logo">PRICELESS</div>
                </header>

                <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
                    }}>
                        <CheckCircle2 size={48} color="var(--success)" />
                    </div>

                    <h1 className="section-title">Payment Successful!</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                        Show this QR code at the designated exit point for validation.
                    </p>

                    <div style={{
                        background: 'white', padding: '20px', borderRadius: '24px', marginBottom: '32px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                    }}>
                        {/* In a real app, use a QR generator library like qrcode.react */}
                        <div style={{ width: '200px', height: '200px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                            <QrCode size={160} color="white" />
                        </div>
                        <p style={{ color: '#000', marginTop: '16px', fontWeight: 'bold', fontSize: '14px' }}>{exitQr}</p>
                    </div>

                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <button className="btn btn-secondary">
                            <Download size={18} /> Download Receipt
                        </button>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            Done <ExternalLink size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ padding: '24px' }}>
            <header className="header" style={{ padding: '0 0 20px 0' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white' }}>
                    <ArrowLeft size={24} />
                </button>
                <div className="logo" style={{ fontSize: '18px' }}>PAYMENT</div>
                <div style={{ width: '24px' }}></div>
            </header>

            <div className="glass-card" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Summary</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Shopping at</span>
                    <span style={{ fontWeight: '600' }}>{outlet?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <span>Total Items</span>
                    <span style={{ fontWeight: '600' }}>{cart.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: '16px' }}>
                    <span style={{ fontSize: '18px' }}>Amount to Pay</span>
                    <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary)' }}>₦{total.toLocaleString()}</span>
                </div>
            </div>

            <div className="glass-card">
                <h2 className="section-title" style={{ fontSize: '18px' }}>Payment Method</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div
                        onClick={() => { }}
                        style={{
                            background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--primary)',
                            borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer'
                        }}
                    >
                        <CreditCard color="var(--primary)" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>In-App Card Payment</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Secure payment via Paystack</div>
                        </div>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                        </div>
                    </div>

                    <div
                        onClick={() => { }}
                        style={{
                            background: 'var(--surface)', border: '1px solid var(--surface-border)',
                            borderRadius: '16px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer'
                        }}
                    >
                        <QrCode color="var(--text-secondary)" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600' }}>Pay at Exit Point</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Show cart to cashier and pay</div>
                        </div>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '1px solid var(--surface-border)' }}></div>
                    </div>
                </div>

                <div style={{ padding: '8px', margin: '16px 0' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        Choose your preferred method. Both require exit validation.
                    </p>
                </div>

                <button className="btn btn-primary" onClick={handlePayment} disabled={loading}>
                    {loading ? 'Processing...' : `Confirm & Get Exit QR`}
                </button>
            </div>
        </div>
    );
};

export default Checkout;
