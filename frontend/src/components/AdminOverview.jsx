import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, Package, ArrowUpRight, Clock, User } from 'lucide-react';

const AdminOverview = ({ adminUsername }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = '/api';
    const headers = {
        'x-admin-username': adminUsername
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/analytics`, { headers });
            const data = await res.json();
            setStats(data);
            setLoading(false);
        } catch (e) {
            console.error(e);
        }
    };

    if (loading || !stats) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading analytics...</div>;
    }

    const cards = [
        { label: 'Total Sales', value: `₦${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: '#22c55e' },
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#6366f1' },
        { label: 'Staff Count', value: stats.totalProducts, icon: Package, color: '#f59e0b' }, // Using products count for now or fix backend
        { label: 'Registered Users', value: stats.totalUsers, icon: Users, color: '#a855f7' },
    ];

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {cards.map((card, i) => (
                    <div key={i} className="glass-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${card.color}15`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <card.icon size={24} />
                            </div>
                            <ArrowUpRight size={18} color="var(--text-secondary)" />
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>{card.label}</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '8px' }}>{card.value}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="glass-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Live Transaction Feed</h3>
                        <Clock size={18} color="var(--text-secondary)" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.recentTransactions.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                Waiting for first sale... 🔴🔵🟠
                            </div>
                        ) : (
                            stats.recentTransactions.map((tx, i) => (
                                <div key={tx.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingBottom: i < stats.recentTransactions.length - 1 ? '16px' : '0',
                                    borderBottom: i < stats.recentTransactions.length - 1 ? '1px solid var(--surface-border)' : 'none'
                                }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={20} color="var(--text-secondary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '14px' }}>Order #{tx.id.split('-')[1].slice(-5)}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(tx.timestamp).toLocaleTimeString()} • {tx.items.length} items</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: '800', color: 'var(--success)' }}>+₦{tx.totalAmount.toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(245, 130, 32, 0.1)', color: '#F58220', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                        <ShoppingBag size={40} />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800' }}>System Health</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '240px' }}>
                        Priceless AI Backend is currently syncing with 3 outlets across Nigeria.
                    </p>
                    <div style={{ marginTop: '20px', padding: '8px 16px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '12px', fontWeight: '800' }}>
                        OPERATIONAL
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
