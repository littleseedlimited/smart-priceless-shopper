import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Signup from './components/Signup';
import EntranceScanner from './components/EntranceScanner';
import Shop from './components/Shop';
import Checkout from './components/Checkout';
import StaffScanner from './components/StaffScanner';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import History from './components/History';
import './index.css';

const App = () => {
  const [user, setUser] = useState(() => {
    // Check for Telegram User
    const tg = window.Telegram?.WebApp;
    if (tg?.initDataUnsafe?.user) {
      const tgUser = tg.initDataUnsafe.user;
      return {
        id: tgUser.id,
        name: `${tgUser.first_name || ''} ${tgUser.last_name || ''}`.trim(),
        username: tgUser.username,
        isTelegram: true
      };
    }
    return JSON.parse(localStorage.getItem('shopper_user'));
  });

  const [activeOutlet, setActiveOutlet] = useState(JSON.parse(localStorage.getItem('active_outlet')) || null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.expand();
      tg.ready();
    }
  }, []);

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('shopper_user', JSON.stringify(updatedUser));
  };

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<EntranceScanner onOutletDetected={setActiveOutlet} />} />
          <Route path="/signup" element={<Signup onSignup={handleUserUpdate} />} />
          <Route path="/shop" element={<Shop user={user} outlet={activeOutlet} />} />
          <Route path="/checkout" element={<Checkout user={user} outlet={activeOutlet} />} />
          <Route path="/profile" element={<Profile user={user} onUpdate={handleUserUpdate} />} />
          <Route path="/history" element={<History user={user} />} />
          <Route path="/staff" element={<StaffScanner />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
