import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ShoppingBag, ChevronRight, Receipt } from 'lucide-react';
import axios from 'axios';

const History = ({ user }) => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/transactions/${user.id}`);
                setOrders(response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) fetchHistory();
    }, [user]);

    return (
        <div className="animate-fade-in" style={{ padding: '24px', minHeight: '100vh' }}>
            <header className="header" style={{ padding: '0 0 24px 0' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white' }}>
                    <ArrowLeft size={24} />
                </button>
                <div className="logo" style={{ fontSize: '18px' }}>MY ORDERS</div>
                <div style={{ width: '24px' }}></div>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.5 }}>Loading history...</div>
            ) : orders.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
                    <ShoppingBag size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-secondary)' }}>You haven't made any purchases yet.</p>
                    <button className="btn btn-primary" style={{ marginTop: '24px' }} onClick={() => navigate('/shop')}>
                        Start Shopping
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {orders.map(order => (
                        <div key={order.id} className="glass-card" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Receipt size={18} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '14px' }}>{order.id}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={10} /> {new Date(order.timestamp).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: '800', color: 'var(--primary)' }}>₦{order.totalAmount.toLocaleString()}</div>
                                    <div style={{ fontSize: '10px', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{order.status}</div>
                                </div>
                            </div>

                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                {order.items.length} items from {order.outletId}
                            </div>

                            <button className="btn btn-secondary" style={{ height: '40px', fontSize: '13px' }}>
                                View Full Receipt <ChevronRight size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
