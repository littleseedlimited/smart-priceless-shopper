import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, CheckCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';

const Signup = ({ onSignup }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name || '',
        phone: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Info, 2: Verification

    useEffect(() => {
        // If we have enough info from Telegram, we could skip this or just ask for phone
        const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (tgUser && !localStorage.getItem('shopper_user')) {
            // Logic for auto-signup if needed
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate sending OTP
        setTimeout(() => {
            setStep(2);
            setLoading(false);
        }, 1500);
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:5000/api/auth/signup', formData);
            onSignup(response.data.user);
            navigate('/shop');
        } catch (err) {
            console.error(err);
            alert("Registration failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ padding: '24px' }}>
            <header className="header" style={{ padding: '0 0 30px 0' }}>
                <div className="logo">PRICELESS</div>
            </header>

            <div className="glass-card">
                {step === 1 ? (
                    <>
                        <h1 className="section-title">Activate Your Account</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            One-time setup for a seamless checkout experience.
                        </p>

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
                                        placeholder="Enter your full name"
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
                                        type="tel"
                                        className="input-field"
                                        style={{ paddingLeft: '48px' }}
                                        placeholder="+234 ..."
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
                                        placeholder="example@mail.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <button className="btn btn-primary" disabled={loading}>
                                {loading ? 'Sending Verification...' : 'Get Activation Code'}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
                        }}>
                            <CheckCircle size={32} color="var(--success)" />
                        </div>
                        <h1 className="section-title">Verify Your Phone</h1>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            We've sent a 4-digit code to your phone. (Enter any 4 digits for demo)
                        </p>

                        <div className="input-group">
                            <input
                                className="input-field"
                                style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '24px' }}
                                maxLength={4}
                                placeholder="0 0 0 0"
                            />
                        </div>

                        <button className="btn btn-primary" onClick={handleVerify} disabled={loading}>
                            {loading ? 'Verifying...' : 'Activate & Start Shopping'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Signup;
