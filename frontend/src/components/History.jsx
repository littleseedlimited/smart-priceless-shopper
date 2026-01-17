import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ShoppingBag, ChevronRight, Receipt, Printer, X, FileText } from 'lucide-react';
import axios from 'axios';

const ReceiptModal = ({ order, onClose }) => {
    if (!order) return null;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
            <div className="glass-card receipt-paper" style={{
                width: '100%', maxWidth: '400px', padding: '32px', background: 'white', color: '#1a1a1a',
                borderRadius: '0', position: 'relative'
            }}>
                <button onClick={onClose} className="hide-print" style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#aaa' }}>
                    <X size={24} />
                </button>

                <div style={{ textAlign: 'center', borderBottom: '2px dashed #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900' }}>PRICELESS SHOPPER</h2>
                    <p style={{ fontSize: '12px', margin: '4px 0', opacity: 0.7 }}>{order.outletName || 'Retail Point of Sale'}</p>
                    <div style={{ fontSize: '10px', marginTop: '8px' }}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>

                <div style={{ fontSize: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span>Order ID:</span>
                        <span style={{ fontWeight: '700' }}>{order.orderId.substring(4, 14)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Payment:</span>
                        <span style={{ fontWeight: '700' }}>{order.paymentMethod}</span>
                    </div>
                </div>

                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                    {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                            <span>{item.name} x{item.quantity}</span>
                            <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900', marginBottom: '20px' }}>
                    <span>TOTAL</span>
                    <span>₦{order.total.toLocaleString()}</span>
                </div>

                <div style={{ textAlign: 'center', fontSize: '11px', opacity: 0.6, marginBottom: '24px' }}>
                    Thank you for shopping with us!<br />
                    Please keep this receipt for exit verification.
                </div>

                <button onClick={handlePrint} className="hide-print primary-button" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Printer size={18} /> Print Receipt
                </button>
            </div>
            <style>{`
                @media print {
                    .hide-print { display: none !important; }
                    body * { visibility: hidden; }
                    .receipt-paper, .receipt-paper * { visibility: visible; }
                    .receipt-paper { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
                }
            `}</style>
        </div>
    );
};

const History = ({ user }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const API_BASE = '/api';

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get(`${API_BASE}/orders/user/${user.id}`);
                setOrders(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) fetchHistory();
    }, [user]);

    return (
        <div className="animate-fade-in" style={{ padding: '24px', minHeight: '100vh', paddingBottom: '100px' }}>
            <header className="header" style={{ padding: '0 0 24px 0' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white' }}>
                    <ArrowLeft size={24} />
                </button>
                <div className="logo" style={{ fontSize: '18px' }}>PURCHASE HISTORY</div>
                <div style={{ width: '24px' }}></div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>Loading orders...</div>
            ) : orders.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No purchases found on this account.</p>
                    <button className="primary-button" style={{ marginTop: '24px' }} onClick={() => navigate('/')}>
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {Object.entries(
                        orders.reduce((groups, order) => {
                            const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
                            if (!groups[date]) groups[date] = [];
                            groups[date].push(order);
                            return groups;
                        }, {})
                    ).map(([date, dateOrders]) => (
                        <div key={date}>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>{date}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {dateOrders.map(order => (
                                    <div key={order.orderId} className="glass-card" style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Receipt size={20} color="var(--brand-blue)" />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{order.outletName || 'Store Order'}</div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Clock size={10} /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: '800', color: 'var(--success)' }}>₦{order.total.toLocaleString()}</div>
                                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{order.paymentMethod}</div>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                            {order.items.length} items purchased
                                        </div>

                                        <button
                                            className="primary-button"
                                            style={{ width: '100%', height: '44px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            <FileText size={16} /> View & Print Receipt
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {selectedOrder && (
                <ReceiptModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                />
            )}
        </div>
    );
};

export default History;
