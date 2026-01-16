import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet as WalletIcon, Plus, History, CreditCard, Landmark, ChevronRight, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import axios from 'axios';

const Wallet = ({ user }) => {
    const navigate = useNavigate();
    const [walletData, setWalletData] = useState({ balance: 0, transactions: [] });
    const [loading, setLoading] = useState(true);
    const [showFundModal, setShowFundModal] = useState(false);
    const [fundAmount, setFundAmount] = useState('');
    const [fundMethod, setFundMethod] = useState('Paystack'); // Paystack or Bank Transfer
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    const API_BASE = '/api';

    const fetchWallet = async () => {
        try {
            const res = await axios.get(`${API_BASE}/users/${user.id}/wallet`);
            setWalletData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.id) fetchWallet();
    }, [user]);

    const handleFund = async () => {
        if (!fundAmount || parseFloat(fundAmount) <= 0) return alert("Enter a valid amount");

        setProcessing(true);
        try {
            // Simulate Payment Gateway Delay
            await new Promise(r => setTimeout(r, 2000));

            const res = await axios.post(`${API_BASE}/users/${user.id}/wallet/fund`, {
                amount: fundAmount,
                method: fundMethod,
                reference: `FLW-${Date.now()}`
            });

            if (res.data) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setShowFundModal(false);
                    setFundAmount('');
                    fetchWallet();
                }, 2000);
            }
        } catch (err) {
            alert("Funding failed: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '24px', minHeight: '100vh', paddingBottom: '100px' }}>
            <header className="header" style={{ padding: '0 0 24px 0' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white' }}>
                    <ArrowLeft size={24} />
                </button>
                <div className="logo" style={{ fontSize: '18px' }}>PRICELESS WALLET</div>
                <div style={{ width: '24px' }}></div>
            </header>

            {/* Wallet Card */}
            <div className="glass-card" style={{
                background: 'linear-gradient(135deg, var(--brand-blue), var(--primary))',
                color: 'white',
                padding: '32px',
                borderRadius: '24px',
                marginBottom: '24px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
                    <WalletIcon size={120} />
                </div>

                <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Current Balance</div>
                <div style={{ fontSize: '36px', fontWeight: '900', marginBottom: '24px' }}>
                    ₦{walletData.balance.toLocaleString()}
                </div>

                <button
                    onClick={() => setShowFundModal(true)}
                    style={{
                        background: 'white',
                        color: 'var(--brand-blue)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                    }}
                >
                    <Plus size={18} /> FUND WALLET
                </button>
            </div>

            {/* Transaction History */}
            <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800' }}>TRANSATIONS</h3>
                    <TrendingUp size={16} color="var(--success)" />
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>Loading...</div>
                ) : walletData.transactions.length === 0 ? (
                    <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
                        <History size={32} style={{ marginBottom: '12px', opacity: 0.2 }} />
                        <p style={{ fontSize: '14px', opacity: 0.5 }}>No recent transactions</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {walletData.transactions.reverse().map((tx, i) => (
                            <div key={i} className="glass-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: tx.type === 'CREDIT' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {tx.type === 'CREDIT' ? <TrendingUp size={18} color="var(--success)" /> : <TrendingDown size={18} color="var(--error)" />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{tx.purpose}</div>
                                        <div style={{ fontSize: '11px', opacity: 0.5 }}>{new Date(tx.date).toLocaleDateString()}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        fontWeight: '800',
                                        color: tx.type === 'CREDIT' ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {tx.type === 'CREDIT' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: 0.5 }}>{tx.method || 'Order'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Funding Modal */}
            {showFundModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="animate-slide-up" style={{
                        width: '100%', maxWidth: '500px', background: '#1a1a1a', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
                        padding: '32px', border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        {success ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--success)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 size={40} color="white" />
                                </div>
                                <h2 style={{ margin: 0, fontWeight: '900' }}>FUNDING SUCCESSFUL</h2>
                                <p style={{ opacity: 0.6 }}>Your wallet balance has been updated</p>
                            </div>
                        ) : (
                            <>
                                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ margin: 0, fontWeight: '900' }}>FUND YOUR WALLET</h3>
                                    <button onClick={() => setShowFundModal(false)} style={{ background: 'none', border: 'none', color: 'white' }}>
                                        <X size={24} />
                                    </button>
                                </header>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '8px', display: 'block' }}>AMOUNT TO FUND (₦)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        placeholder="Enter amount"
                                        value={fundAmount}
                                        onChange={(e) => setFundAmount(e.target.value)}
                                        style={{ fontSize: '24px', fontWeight: '800', padding: '16px' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '32px' }}>
                                    <label style={{ fontSize: '12px', opacity: 0.6, marginBottom: '12px', display: 'block' }}>PAYMENT METHOD</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div
                                            onClick={() => setFundMethod('Paystack')}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '16px',
                                                border: `2px solid ${fundMethod === 'Paystack' ? 'var(--brand-blue)' : 'transparent'}`,
                                                background: 'rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <CreditCard size={20} color="var(--brand-blue)" />
                                                <div style={{ fontWeight: '700' }}>Paystack (Card/Transfer)</div>
                                            </div>
                                            <ChevronRight size={16} opacity={0.3} />
                                        </div>
                                        <div
                                            onClick={() => setFundMethod('Bank Transfer')}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '16px',
                                                border: `2px solid ${fundMethod === 'Bank Transfer' ? 'var(--brand-orange)' : 'transparent'}`,
                                                background: 'rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Landmark size={20} color="var(--brand-orange)" />
                                                <div style={{ fontWeight: '700' }}>Direct Bank Transfer</div>
                                            </div>
                                            <ChevronRight size={16} opacity={0.3} />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    className="primary-button"
                                    style={{ width: '100%', height: '56px', borderRadius: '16px', fontWeight: '900' }}
                                    onClick={handleFund}
                                    disabled={processing}
                                >
                                    {processing ? 'PROCESSING PAYMENT...' : `PAY ₦${parseFloat(fundAmount || 0).toLocaleString()}`}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Wallet;
