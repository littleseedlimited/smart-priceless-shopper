import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ShoppingCart, Package, Trash2, ChevronRight, X, Search, Bell, Star, Scan, Camera, Sparkles, RefreshCw } from 'lucide-react';
import axios from 'axios';
import BottomNav from './BottomNav';

const Shop = ({ user, outlet }) => {
    const navigate = useNavigate();
    const [cart, setCart] = useState(JSON.parse(localStorage.getItem('shopper_cart') || '[]'));
    const [scannerActive, setScannerActive] = useState(false);
    const [showCart, setShowCart] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState([
        { barcode: '123456', name: 'Nestlé Milo 500g', price: 2500, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200', category: 'Beverage', rating: 4.8 },
        { barcode: '234567', name: 'Peak Full Cream Milk', price: 1800, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200', category: 'Dairy', rating: 4.9 },
    ]);

    const [scanBuffer, setScanBuffer] = useState({ code: '', count: 0 });
    const [isIdentifying, setIsIdentifying] = useState(false);
    const API_BASE = '/api';

    useEffect(() => {
        if (!outlet) navigate('/');

        const handleToggleScanner = () => setScannerActive(prev => !prev);
        window.addEventListener('toggle-scanner', handleToggleScanner);
        return () => window.removeEventListener('toggle-scanner', handleToggleScanner);
    }, [outlet, navigate]);

    useEffect(() => {
        localStorage.setItem('shopper_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        let scanner;
        if (scannerActive) {
            scanner = new Html5Qrcode("item-reader");
            const config = {
                fps: 24,
                qrbox: { width: 280, height: 280 },
                experimentalFeatures: {
                    useBarCodeDetectorIfSupported: true
                },
                aspectRatio: 1.0,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.ITF,
                    Html5QrcodeSupportedFormats.QR_CODE
                ]
            };

            scanner.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    // Consensus Logic: Verify 2 times for efficiency + accuracy
                    setScanBuffer(prev => {
                        if (prev.code === decodedText) {
                            if (prev.count + 1 >= 2) {
                                handleConfirmScan(decodedText);
                                return { code: '', count: 0 };
                            }
                            return { ...prev, count: prev.count + 1 };
                        }
                        return { code: decodedText, count: 1 };
                    });
                }
            ).catch(err => console.error("Scanner initialization failed", err));
        }
        return () => {
            if (scanner) {
                if (scanner.isScanning) {
                    scanner.stop().then(() => scanner.clear()).catch(e => console.error(e));
                }
            }
        };
    }, [scannerActive]);

    const handleConfirmScan = async (code) => {
        try {
            const response = await axios.get(`${API_BASE}/products/${code}`);
            if (response.data) {
                addToCart(response.data);
                // Visual feedback
                const feedback = document.createElement('div');
                feedback.className = 'scan-success-flash';
                document.body.appendChild(feedback);
                setTimeout(() => feedback.remove(), 500);

                setScannerActive(false);
                setScanBuffer({ code: '', count: 0 });
            }
        } catch (err) {
            console.warn("Item not found by barcode:", code);
        }
    };

    const handleAIIdentify = async () => {
        setIsIdentifying(true);
        try {
            const video = document.querySelector('#item-reader video');
            if (!video) throw new Error("Video stream not found");

            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            const res = await axios.post(`${API_BASE}/vision/identify`, { image: imageData });

            if (res.data.products && res.data.products.length > 0) {
                const product = res.data.products[0];
                addToCart(product);
                alert(`AI Identified: ${product.name}`);
                setScannerActive(false);
            } else {
                alert("AI couldn't identify the product. Try a clearer angle.");
            }
        } catch (err) {
            console.error("AI Identity Error:", err);
            alert("AI service unavailable.");
        } finally {
            setIsIdentifying(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.barcode === product.barcode);
            if (existing) {
                return prev.map(item => item.barcode === product.barcode ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (barcode, delta) => {
        setCart(prev => prev.map(item => {
            if (item.barcode === barcode) return { ...item, quantity: Math.max(0, item.quantity + delta) };
            return item;
        }).filter(item => item.quantity > 0));
    };

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="animate-fade-in" style={{ pb: '100px', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <header className="header" style={{ paddingBottom: '10px' }}>
                <div>
                    <h1 style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Welcome back,</h1>
                    <div style={{ fontSize: '20px', fontWeight: '800' }}>{user?.name || 'Shopper'} 👋</div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={20} />
                    </div>
                    <div onClick={() => setShowCart(true)} style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
                        <ShoppingCart size={20} />
                        {cart.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--error)', width: '20px', height: '20px', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{cart.length}</span>}
                    </div>
                </div>
            </header>

            <div style={{ padding: '0 24px 20px' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input className="input-field" style={{ paddingLeft: '48px', height: '54px' }} placeholder="Search for items..." />
                </div>
            </div>

            <main style={{ padding: '0 24px 100px', flex: 1 }}>
                {scannerActive && (
                    <div className="animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 2000, background: '#000' }}>
                        <div className="header" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                            <div className="logo" style={{ color: 'white' }}>SMART SCANNER</div>
                            <button onClick={() => setScannerActive(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px', borderRadius: '50%', color: 'white' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                            <div id="item-reader" style={{ width: '100%', height: '100%', objectFit: 'cover' }}></div>

                            {/* Overlay Scanner UI */}
                            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{
                                    width: '280px', height: '280px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '40px',
                                    position: 'relative', overflow: 'hidden'
                                }}>
                                    <div className="scanner-laser"></div>
                                    {scanBuffer.count > 0 && (
                                        <div style={{
                                            position: 'absolute', bottom: '20px', left: '0', right: '0', textAlign: 'center',
                                            color: 'var(--primary)', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                        }}>
                                            Verifying... {scanBuffer.count * 50}%
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', padding: '0 40px' }}>
                                <div style={{ display: 'flex', gap: '16px' }}>
                                    <button
                                        onClick={handleAIIdentify}
                                        disabled={isIdentifying}
                                        style={{
                                            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)',
                                            color: 'white', padding: '12px 24px', borderRadius: '16px', fontWeight: 'bold',
                                            display: 'flex', alignItems: 'center', gap: '10px'
                                        }}
                                    >
                                        {isIdentifying ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} color="var(--accent)" />}
                                        {isIdentifying ? 'IDENTIFYING...' : 'AI IDENTIFY'}
                                    </button>
                                </div>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textAlign: 'center' }}>
                                    Point at barcode or use AI if barcode is damaged
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="glass-card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Package color="var(--success)" size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{outlet?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Owerri, Nigeria • Open till 10 PM</div>
                    </div>
                </div>

                <h2 className="section-title">Special Offers</h2>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px', margin: '0 -24px', paddingLeft: '24px' }}>
                    {featuredProducts.map(p => (
                        <div key={p.barcode} className="product-card" style={{ minWidth: '200px', padding: '12px' }}>
                            <div style={{ position: 'relative', marginBottom: '12px' }}>
                                <img src={p.image} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '16px' }} alt={p.name} />
                                <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '8px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Star size={10} color="var(--accent)" fill="var(--accent)" /> {p.rating}
                                </div>
                            </div>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{p.name}</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="price-tag" style={{ fontSize: '16px' }}>₦{p.price.toLocaleString()}</span>
                                <button
                                    onClick={() => addToCart(p)}
                                    style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                                >
                                    <ShoppingCart size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="section-title" style={{ marginTop: '24px' }}>Your Session</h2>
                {cart.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        <Scan size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>Scan items as you pick them up to see your running total!</p>
                    </div>
                ) : (
                    <div className="glass-card" style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Subtotal ({cart.length} items)</div>
                                <div style={{ fontSize: '24px', fontWeight: '800' }}>₦{total.toLocaleString()}</div>
                            </div>
                            <button
                                onClick={() => navigate('/checkout')}
                                style={{ height: '54px', padding: '0 24px', borderRadius: '16px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                Checkout <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {showCart && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
                    <div className="animate-slide-up" style={{ width: '100%', maxHeight: '80vh', background: 'var(--background)', borderTopLeftRadius: '32px', borderTopRightRadius: '32px', padding: '32px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <h2 className="section-title" style={{ marginBottom: 0 }}>My Cart</h2>
                                {cart.length > 0 && (
                                    <button
                                        onClick={() => { if (window.confirm('Clear all items?')) setCart([]); }}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--error)', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowCart(false)} style={{ background: 'var(--surface)', border: 'none', padding: '8px', borderRadius: '50%', color: 'white' }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {cart.map(item => (
                                <div key={item.barcode} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <img src={item.image || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=100'} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                                        <div className="price-tag" style={{ fontSize: '15px' }}>₦{item.price.toLocaleString()}</div>
                                    </div>
                                    <div className="quantity-picker">
                                        <button className="quantity-btn" onClick={() => updateQuantity(item.barcode, -1)}>-</button>
                                        <span style={{ width: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                                        <button className="quantity-btn" onClick={() => updateQuantity(item.barcode, 1)}>+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-primary" style={{ marginTop: '32px' }} onClick={() => navigate('/checkout')}>
                            Proceed to Payment ₦{total.toLocaleString()}
                        </button>
                    </div>
                </div>
            )}

            <BottomNav cartCount={cart.length} />
        </div>
    );
};

export default Shop;
