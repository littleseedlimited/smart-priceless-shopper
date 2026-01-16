import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, Users, Package, ArrowUpRight, Clock, User, X, Search, FileText } from 'lucide-react';

const DetailModal = ({ type, data, onClose, adminUsername }) => {
    const [search, setSearch] = useState('');
    const filteredData = data.filter(item => {
        const s = search.toLowerCase();
        if (type === 'Orders' || type === 'Sales') {
            return item.orderId.toLowerCase().includes(s) || String(item.userId).includes(s);
        }
        if (type === 'Registered Users') {
            return (item.name && item.name.toLowerCase().includes(s)) || String(item.telegramId).includes(s);
        }
        if (type === 'Staff Count') {
            return (item.name && item.name.toLowerCase().includes(s)) || item.username.toLowerCase().includes(s);
        }
        return true;
    });

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div className="glass-card" style={{
                width: '90%', maxWidth: '800px', maxHeight: '85vh',
                padding: '32px', position: 'relative', overflow: 'hidden',
                display: 'flex', flexDirection: 'column'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
                }}>
                    <ArrowUpRight size={24} style={{ transform: 'rotate(90deg)' }} />
                </button>

                <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '800' }}>{type} Details</h2>

                <div style={{ position: 'relative', marginBottom: '20px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input
                        type="text"
                        placeholder={`Search ${type}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '12px 12px 12px 40px',
                            background: 'var(--surface)', border: '1px solid var(--surface-border)',
                            borderRadius: '12px', color: 'var(--white)', outline: 'none'
                        }}
                    />
                </div>

                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
                    {filteredData.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No entries found.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        {type === 'Registered Users' || type === 'Staff Count' ? 'Name' : 'Order ID'}
                                    </th>
                                    <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                        {type === 'Registered Users' ? 'Telegram ID' : (type === 'Staff Count' ? 'Role' : 'Total')}
                                    </th>
                                    <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((item, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <div style={{ fontWeight: '700' }}>
                                                {type === 'Registered Users' || type === 'Staff Count' ? item.name || 'Anonymous' : item.orderId}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {type === 'Orders' || type === 'Sales' ? new Date(item.createdAt).toLocaleString() : (item.email || item.username)}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            {type === 'Orders' || type === 'Sales' ? (
                                                <span style={{ color: 'var(--success)', fontWeight: '700' }}>₦{item.total.toLocaleString()}</span>
                                            ) : (
                                                <span>{item.telegramId || item.role}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            <button className="primary-button" style={{ padding: '6px 12px', fontSize: '12px' }}>
                                                {type === 'Orders' || type === 'Sales' ? 'Receipt' : 'Edit'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminOverview = ({ adminUsername }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalData, setModalData] = useState(null);
    const [modalType, setModalType] = useState(null);

    const API_BASE = '/api';
    const headers = { 'x-admin-username': adminUsername };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/stats`, { headers });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to fetch stats');
            }
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error('Stats Fetch Error:', e);
            // Fallback to empty stats if server is not responding correctly
            if (!stats) setStats({ totalSales: 0, totalOrders: 0, staffCount: 0, userCount: 0 });
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = async (type) => {
        let endpoint = '';
        if (type === 'Total Orders' || type === 'Total Sales') endpoint = '/admin/orders';
        else if (type === 'Registered Users') endpoint = '/admin/users';
        else if (type === 'Staff Count') endpoint = '/admin/staff';

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, { headers });
            const data = await res.json();
            setModalData(data);
            setModalType(type);
        } catch (e) { console.error(e); }
    };

    if (loading || !stats) {
        return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading analytics...</div>;
    }

    const cards = [
        { label: 'Total Sales', value: `₦${stats.totalSales.toLocaleString()}`, icon: DollarSign, color: '#22c55e' },
        { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#6366f1' },
        { label: 'Staff Count', value: stats.staffCount, icon: User, color: '#f59e0b' },
        { label: 'Registered Users', value: stats.userCount, icon: Users, color: '#a855f7' },
    ];

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {cards.map((card, i) => (
                    <div
                        key={i}
                        className="glass-card clickable"
                        style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={() => handleCardClick(card.label)}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
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
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>System Intelligence</h3>
                        <Clock size={18} color="var(--text-secondary)" />
                    </div>
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚡</div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                            Click any metric card above to view searchable, real-time records and manage your store performance.
                        </p>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <ShoppingBag size={40} />
                    </div>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '800' }}>Cloud Service</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Live sync active. Orders from Telegram and Web are merging in real-time.
                    </p>
                    <div style={{ marginTop: '20px', display: 'inline-block', padding: '8px 16px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', fontSize: '12px', fontWeight: '800' }}>
                        SYNCING ACTIVE
                    </div>
                </div>
            </div>

            {modalData && (
                <DetailModal
                    type={modalType}
                    data={modalData}
                    onClose={() => setModalData(null)}
                    adminUsername={adminUsername}
                />
            )}
        </div>
    );
};

export default AdminOverview;
