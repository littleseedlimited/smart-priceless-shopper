import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';

const Profile = ({ user, onUpdate }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        email: user?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.put(`http://localhost:5000/api/users/${user.id}`, formData);
            onUpdate(response.data.user);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            alert("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '24px' }}>
            <header className="header" style={{ padding: '0 0 24px 0' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white' }}>
                    <ArrowLeft size={24} />
                </button>
                <div className="logo" style={{ fontSize: '18px' }}>PROFILE</div>
                <div style={{ width: '24px' }}></div>
            </header>

            <div className="glass-card">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)',
                        margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', fontWeight: 'bold'
                    }}>
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '800' }}>{user?.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Shopper ID: {user?.id}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                name="name"
                                required
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                name="phone"
                                required
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                            <input
                                name="email"
                                required
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <button className="btn btn-primary" disabled={loading}>
                        {loading ? 'Saving...' : success ? 'Updated Successfully!' : 'Save Changes'}
                        {!loading && !success && <Save size={18} />}
                        {success && <CheckCircle size={18} />}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
