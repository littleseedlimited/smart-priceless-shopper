import React, { useState, useEffect } from 'react';
import { Settings, Store, User, MessageSquare, Save, RefreshCw } from 'lucide-react';

const AdminSettings = ({ adminUsername }) => {
    const [settings, setSettings] = useState({
        storeName: '',
        location: '',
        operatingHours: '',
        adminDisplayName: adminUsername,
        welcomeMessage: '',
        contactSupport: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch('/api/admin/settings', {
            headers: { 'x-admin-username': adminUsername }
        })
            .then(res => res.json())
            .then(data => setSettings(data))
            .catch(err => console.error("Error fetching settings:", err));
    }, [adminUsername]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-username': adminUsername
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                alert("Settings saved successfully!");
            } else {
                alert("Failed to save settings");
            }
        } catch (e) {
            alert("Network error saving settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <h2 className="section-title">Admin Settings</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                {/* Outlet Settings */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', background: 'rgba(29, 91, 155, 0.1)', borderRadius: '10px', color: 'var(--brand-blue)' }}>
                            <Store size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Outlet Configuration</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Store Name</label>
                            <input type="text" className="input-field" value={settings.storeName} onChange={e => setSettings({ ...settings, storeName: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Location</label>
                            <input type="text" className="input-field" value={settings.location} onChange={e => setSettings({ ...settings, location: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Operating Hours</label>
                            <input type="text" className="input-field" value={settings.operatingHours} onChange={e => setSettings({ ...settings, operatingHours: e.target.value })} />
                        </div>
                    </div>
                </div>

                {/* Profile Settings */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', background: 'rgba(245, 130, 32, 0.1)', borderRadius: '10px', color: 'var(--brand-orange)' }}>
                            <User size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Admin Profile</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Display Name</label>
                            <input type="text" className="input-field" value={settings.adminDisplayName} onChange={e => setSettings({ ...settings, adminDisplayName: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Username (Read-only)</label>
                            <input type="text" className="input-field" value={adminUsername} disabled style={{ opacity: 0.6 }} />
                        </div>
                    </div>
                </div>

                {/* Bot Configuration */}
                <div className="glass-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '10px', color: 'var(--success)' }}>
                            <MessageSquare size={20} />
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>Bot Configuration</h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Welcome Message</label>
                            <textarea
                                className="input-field"
                                style={{ minHeight: '80px', paddingTop: '12px', resize: 'vertical' }}
                                value={settings.welcomeMessage}
                                onChange={e => setSettings({ ...settings, welcomeMessage: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Support Handle</label>
                            <input type="text" className="input-field" value={settings.contactSupport} onChange={e => setSettings({ ...settings, contactSupport: e.target.value })} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    className="btn btn-primary"
                    style={{ width: 'auto', padding: '12px 30px', display: 'flex', alignItems: 'center', gap: '10px' }}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                    {saving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>
        </div>
    );
};

export default AdminSettings;
