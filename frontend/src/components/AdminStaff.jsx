import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, X, Check } from 'lucide-react';

const AdminStaff = ({ adminUsername }) => {
    const [staff, setStaff] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newStaff, setNewStaff] = useState({ username: '', name: '', role: 'INVENTORY_MANAGER' });

    const API_BASE = '/api';
    const headers = {
        'Content-Type': 'application/json',
        'x-admin-username': adminUsername
    };

    const roles = [
        { id: 'SUPER_ADMIN', label: 'Super Admin', color: '#ef4444' },
        { id: 'INVENTORY_MANAGER', label: 'Inventory Manager', color: '#f59e0b' },
        { id: 'BILLING_STAFF', label: 'Billing Staff', color: '#6366f1' }
    ];

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/staff`, { headers });
            const data = await res.json();
            setStaff(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddStaff = async () => {
        try {
            const res = await fetch(`${API_BASE}/admin/staff`, {
                method: 'POST',
                headers,
                body: JSON.stringify(newStaff)
            });
            if (res.ok) {
                fetchStaff();
                setIsAdding(false);
                setNewStaff({ username: '', name: '', role: 'INVENTORY_MANAGER' });
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (e) {
            alert("Error adding staff");
        }
    };

    const handleDeleteStaff = async (username) => {
        if (!window.confirm(`Remove access for ${username}?`)) return;
        try {
            const res = await fetch(`${API_BASE}/admin/staff/${username}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) fetchStaff();
            else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Staff & Permissions</h2>
                <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => setIsAdding(true)}>
                    <UserPlus size={18} /> Add Staff
                </button>
            </div>

            {isAdding && (
                <div className="glass-card animate-slide-up" style={{ marginBottom: '24px', padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label className="input-label">Full Name</label>
                            <input type="text" className="input-field" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="e.g. John Doe" />
                        </div>
                        <div>
                            <label className="input-label">Username</label>
                            <input type="text" className="input-field" value={newStaff.username} onChange={e => setNewStaff({ ...newStaff, username: e.target.value })} placeholder="e.g. johndoe" />
                        </div>
                        <div>
                            <label className="input-label">Assigned Role</label>
                            <select className="input-field" value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })} style={{ appearance: 'none' }}>
                                {roles.map(role => (
                                    <option key={role.id} value={role.id}>{role.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddStaff}><Check size={18} /> Confirm Staff Access</button>
                        <button className="btn btn-secondary" style={{ width: '50px', padding: '0' }} onClick={() => setIsAdding(false)}><X size={18} /></button>
                    </div>
                </div>
            )}

            <div className="glass-card" style={{ padding: '0' }}>
                {staff.map((s, i) => {
                    const role = roles.find(r => r.id === s.role);
                    return (
                        <div key={s.username} style={{
                            padding: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: i < staff.length - 1 ? '1px solid var(--surface-border)' : 'none'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px', height: '48px',
                                    borderRadius: '12px',
                                    background: `${role?.color || '#6366f1'}20`,
                                    color: role?.color || '#6366f1',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Shield size={24} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '16px' }}>{s.name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>@{s.username}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                <div style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    background: `${role?.color || '#6366f1'}15`,
                                    color: role?.color || '#6366f1',
                                    fontSize: '11px', fontWeight: '800', textTransform: 'uppercase'
                                }}>
                                    {role?.label}
                                </div>
                                {s.username !== 'origichidiah' && (
                                    <button
                                        onClick={() => handleDeleteStaff(s.username)}
                                        style={{ border: 'none', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminStaff;
