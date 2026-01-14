import React from 'react';
import { ShoppingBag, Scan, History, User, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNav = ({ cartCount }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const tabs = [
        { name: 'Shop', icon: ShoppingBag, path: '/shop' },
        { name: 'Saved', icon: Heart, path: '#' },
        { name: 'Scan', icon: Scan, path: 'scan', special: true },
        { name: 'History', icon: History, path: '/history' },
        { name: 'Account', icon: User, path: '/profile' }
    ];

    return (
        <nav className="bottom-nav">
            {tabs.map((tab, i) => (
                tab.special ? (
                    <div key={i} className="scan-btn-main" onClick={() => window.dispatchEvent(new CustomEvent('toggle-scanner'))}>
                        <Scan size={28} />
                    </div>
                ) : (
                    <div
                        key={i}
                        className={`nav-item ${location.pathname === tab.path ? 'active' : ''}`}
                        onClick={() => tab.path !== '#' && navigate(tab.path)}
                    >
                        <tab.icon size={22} />
                        <span>{tab.name}</span>
                    </div>
                )
            ))}
        </nav>
    );
};

export default BottomNav;
