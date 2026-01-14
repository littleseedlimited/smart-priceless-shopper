import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Users, Settings, LogOut, Layout, Menu, X } from 'lucide-react';
import AdminOverview from './AdminOverview';
import AdminInventory from './AdminInventory';
import AdminStaff from './AdminStaff';
import AdminSettings from './AdminSettings';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [adminUsername, setAdminUsername] = useState('origichidiah');

    const menuItems = [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory', icon: Package },
        { id: 'staff', label: 'Staff & Roles', icon: Users },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    // Handle resizing
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setSidebarOpen(true);
            else setSidebarOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <AdminOverview adminUsername={adminUsername} />;
            case 'inventory': return <AdminInventory adminUsername={adminUsername} />;
            case 'staff': return <AdminStaff adminUsername={adminUsername} />;
            case 'settings': return <AdminSettings adminUsername={adminUsername} />;
            default: return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Coming Soon</div>;
        }
    };

    return (
        <div className="admin-layout">
            {/* Sidebar Overlay (Mobile) */}
            <div
                className={`sidebar-overlay ${sidebarOpen && window.innerWidth <= 768 ? 'visible' : ''}`}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: sidebarOpen ? '260px' : '80px' }}>
                <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '32px', height: '32px',
                            background: 'linear-gradient(135deg, #E31E24, #F58220)',
                            borderRadius: '8px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Layout size={18} color="white" />
                        </div>
                        {sidebarOpen && <span style={{ fontWeight: '800', fontSize: '18px', letterSpacing: '1px' }}>PRICELESS</span>}
                    </div>
                    {window.innerWidth <= 768 && sidebarOpen && (
                        <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '0 12px' }}>
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (window.innerWidth <= 768) setSidebarOpen(false);
                            }}
                            className={`nav-button ${activeTab === item.id ? 'active' : ''}`}
                        >
                            <item.icon size={20} />
                            {sidebarOpen && <span style={{ fontWeight: '600' }}>{item.label}</span>}
                            {activeTab === item.id && sidebarOpen && (
                                <div style={{ width: '4px', height: '18px', background: '#E31E24', borderRadius: '2px', marginLeft: 'auto' }}></div>
                            )}
                        </button>
                    ))}
                </nav>

                <div style={{ padding: '24px 12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <button className="nav-button" style={{ color: '#ef4444' }}>
                        <LogOut size={20} />
                        {sidebarOpen && <span style={{ fontWeight: '600' }}>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="admin-main">
                <header style={{
                    padding: '20px 40px',
                    background: 'rgba(10, 14, 27, 0.8)',
                    backdropFilter: 'blur(10px)',
                    position: 'sticky', top: 0, zIndex: 100,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }} className="admin-content-padding">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <button
                            onClick={toggleSidebar}
                            style={{
                                background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white',
                                padding: '8px', borderRadius: '8px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <Menu size={20} />
                        </button>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }} className="hide-mobile">
                            Smart Priceless Shopper <span style={{ margin: '0 10px' }}>/</span>
                            <span style={{ color: 'white', fontWeight: '600' }}>{menuItems.find(m => m.id === activeTab)?.label}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }} className="hide-mobile">
                            <div style={{ fontSize: '14px', fontWeight: '700' }}>Original Chidiah</div>
                            <div style={{ fontSize: '11px', color: '#E31E24', fontWeight: '800' }}>SUPER ADMIN</div>
                        </div>
                        <div style={{
                            width: '40px', height: '40px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #E31E24, #1D5B9B)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '14px', fontWeight: '800', color: 'white'
                        }}>
                            OC
                        </div>
                    </div>
                </header>

                <main style={{ padding: '40px' }} className="admin-content-padding">
                    <div className="animate-fade-in">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
