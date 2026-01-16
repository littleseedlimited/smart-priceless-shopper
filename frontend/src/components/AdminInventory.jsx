import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Plus, Trash2, Edit3, Save, X, Search, Upload, Camera, XCircle, Package } from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminInventory = ({ adminUsername }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingBarcode, setEditingBarcode] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [isAdding, setIsAdding] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const scannerRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    const API_BASE = '/api';
    const headers = {
        'Content-Type': 'application/json',
        'x-admin-username': adminUsername
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.barcode || '').includes(searchTerm)
    );

    // Cleanup scanner on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current) {
                html5QrCodeRef.current.stop().catch(() => { });
            }
        };
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_BASE}/products/all`);
            const data = await res.json();
            setProducts(data);
            setLoading(false);
        } catch (e) {
            console.error(e);
        }
    };

    const startScanner = async () => {
        setShowScanner(true);

        // Wait for modal to render
        setTimeout(async () => {
            try {
                const Html5Qrcode = window.Html5Qrcode;
                const Html5QrcodeSupportedFormats = window.Html5QrcodeSupportedFormats;
                if (!Html5Qrcode || !Html5QrcodeSupportedFormats) {
                    alert("Scanner library not loaded. Please refresh the page.");
                    setShowScanner(false);
                    return;
                }

                html5QrCodeRef.current = new Html5Qrcode("admin-scanner-reader");

                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length > 0) {
                    const backCamera = cameras.find(c => c.label.toLowerCase().includes('back')) || cameras[cameras.length - 1];

                    await html5QrCodeRef.current.start(
                        backCamera.id,
                        {
                            fps: 15,
                            qrbox: { width: 250, height: 150 },
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
                        },
                        (decodedText) => {
                            // Barcode scanned successfully
                            setEditForm(prev => ({ ...prev, barcode: decodedText.trim() }));
                            stopScanner();
                        },
                        (errorMessage) => {
                            // Scan error - ignore, keep scanning
                        }
                    );
                } else {
                    alert("No camera detected");
                    setShowScanner(false);
                }
            } catch (err) {
                console.error("Scanner error:", err);
                alert("Camera error: " + err.message);
                setShowScanner(false);
            }
        }, 100);
    };

    const stopScanner = async () => {
        if (html5QrCodeRef.current) {
            try {
                await html5QrCodeRef.current.stop();
                html5QrCodeRef.current = null;
            } catch (e) {
                console.error("Error stopping scanner:", e);
            }
        }
        setShowScanner(false);
    };

    const handleScanBarcode = () => {
        startScanner();
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Map common column names
                const mappedData = data.map(row => ({
                    barcode: String(row.barcode || row.Barcode || row.BARCODE || '').trim(),
                    name: row.name || row.Name || row.NAME || '',
                    price: parseInt(row.price || row.Price || row.PRICE || 0),
                    category: row.category || row.Category || 'Other',
                    description: row.description || row.Description || ''
                })).filter(p => p.barcode && p.name);

                if (mappedData.length === 0) throw new Error("No valid products found in file");

                const res = await fetch(`${API_BASE}/admin/products/bulk`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(mappedData)
                });

                if (res.ok) {
                    const result = await res.json();
                    alert(`Success: Added ${result.added}, Updated ${result.updated}`);
                    fetchProducts();
                } else {
                    const err = await res.json();
                    alert(err.error || "Upload failed");
                }
            } catch (err) {
                alert("Error: " + err.message);
            } finally {
                setUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleEdit = (product) => {
        setEditingBarcode(product.barcode);
        setEditForm(product);
    };

    const handleSave = async () => {
        try {
            const endpoint = isAdding ? `${API_BASE}/admin/products` : `${API_BASE}/admin/products/${editingBarcode}`;
            const method = isAdding ? 'POST' : 'PUT';

            const trimmedBarcode = String(editForm.barcode).trim();

            // If we have a new captured image, we'll send it as part of the initial creation
            // or as a separate update if editing.
            const res = await fetch(endpoint, {
                method,
                headers,
                body: JSON.stringify({ ...editForm, barcode: trimmedBarcode })
            });

            if (res.ok) {
                // If we captured a new image while EDITING, upload it to the array endpoint
                if (!isAdding && editForm.newImage) {
                    await fetch(`${API_BASE}/admin/products/${trimmedBarcode}/image`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ image: editForm.newImage })
                    });
                }

                fetchProducts();
                setEditingBarcode(null);
                setIsAdding(false);
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (e) {
            alert("Error saving product");
        }
    };

    const handleDelete = async (barcode) => {
        if (!window.confirm("Delete this product?")) return;
        try {
            const res = await fetch(`${API_BASE}/admin/products/${barcode}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) fetchProducts();
            else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDownloadTemplate = () => {
        const templateData = [
            { barcode: '123456789', name: 'Sample Product', price: 1000, category: 'General', description: 'Sample description' }
        ];
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "InventoryTemplate");
        XLSX.writeFile(workbook, "inventory_template.xlsx");
    };

    const handleAddClick = (mode) => {
        if (mode === 'scan') {
            handleScanBarcode();
            setIsAdding(true);
            setEditingBarcode('new');
            setEditForm({ barcode: '', name: '', price: 0, category: '', description: '' });
        } else if (mode === 'manual') {
            setIsAdding(true);
            setEditingBarcode('new');
            setEditForm({ barcode: '', name: '', price: 0, category: '', description: '' });
        }
        setShowAddMenu(false);
    };

    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);

    const startCamera = async () => {
        setShowCamera(true);
        setTimeout(async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (err) {
                console.error("Camera error:", err);
                setShowCamera(false);
            }
        }, 100);
    };

    const capturePhoto = () => {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0);

        // Resize to lightweight (e.g., 800px width)
        const resizedCanvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scale = MAX_WIDTH / canvas.width;
        resizedCanvas.width = MAX_WIDTH;
        resizedCanvas.height = canvas.height * scale;
        resizedCanvas.getContext('2d').drawImage(canvas, 0, 0, MAX_WIDTH, resizedCanvas.height);

        const imageData = resizedCanvas.toDataURL('image/jpeg', 0.8);
        setEditForm(prev => {
            if (isAdding) return { ...prev, images: [...(prev.images || []), imageData] };
            return { ...prev, newImage: imageData };
        });

        // Stop camera
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        setShowCamera(false);
    };

    return (
        <div className="animate-fade-in" onClick={() => showAddMenu && setShowAddMenu(false)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '15px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Inventory Management</h2>
                <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
                    <button className="btn btn-secondary" style={{ width: 'auto', padding: '10px 20px' }} onClick={handleDownloadTemplate}>
                        <ShoppingBag size={18} /> Download Template
                    </button>

                    <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}>
                        <Plus size={18} /> Add Product
                    </button>

                    {showAddMenu && (
                        <div className="glass-card" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '10px',
                            zIndex: 100,
                            padding: '10px',
                            minWidth: '200px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                            border: '1px solid var(--surface-border)'
                        }}>
                            <div className="menu-item" style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px' }} onClick={() => handleAddClick('manual')}>
                                <Edit3 size={18} color="var(--brand-orange)" /> Direct Entry
                            </div>
                            <div className="menu-item" style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px' }} onClick={() => handleAddClick('scan')}>
                                <Camera size={18} color="var(--brand-blue)" /> Scan Barcode
                            </div>
                            <label className="menu-item" style={{ padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px', margin: 0 }}>
                                <Upload size={18} color="var(--success)" /> {uploading ? 'Processing...' : 'Upload File'}
                                <input type="file" hidden accept=".csv, .xlsx, .xls" onChange={(e) => { handleFileUpload(e); setShowAddMenu(false); }} disabled={uploading} />
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '0', marginBottom: '24px' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Search by name or barcode..."
                            style={{ paddingLeft: '40px' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--surface-border)', color: 'var(--text-secondary)', fontSize: '13px' }}>
                                <th style={{ padding: '16px 20px' }}>Image</th>
                                <th style={{ padding: '16px 20px' }}>Barcode</th>
                                <th style={{ padding: '16px 20px' }}>Product Name</th>
                                <th style={{ padding: '16px 20px' }}>Price (₦)</th>
                                <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p.barcode} style={{ borderBottom: '1px solid var(--surface-border)', fontSize: '14px' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#333', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            {p.images && p.images.length > 0 ? (
                                                <>
                                                    <img src={p.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    {p.images.length > 1 && (
                                                        <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--brand-red)', color: 'white', fontSize: '10px', padding: '1px 4px', borderRadius: '4px 0 0 0', fontWeight: 'bold' }}>
                                                            +{p.images.length - 1}
                                                        </div>
                                                    )}
                                                </>
                                            ) : p.image ? (
                                                <img src={p.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : <Package size={20} color="#666" />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px', fontWeight: 'bold' }}>{p.barcode}</td>
                                    <td style={{ padding: '16px 20px' }}>
                                        {editingBarcode === p.barcode ? (
                                            <input type="text" className="input-field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                        ) : p.name}
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        {editingBarcode === p.barcode ? (
                                            <input type="number" className="input-field" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: parseInt(e.target.value) })} />
                                        ) : (p.price || 0).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {editingBarcode === p.barcode ? (
                                                <>
                                                    <button onClick={startCamera} style={{ background: 'var(--brand-blue)', border: 'none', borderRadius: '8px', padding: '6px', color: 'white' }}><Camera size={16} /></button>
                                                    <button onClick={handleSave} style={{ background: 'var(--success)', border: 'none', borderRadius: '8px', padding: '6px', color: 'white', cursor: 'pointer' }}><Save size={16} /></button>
                                                    <button onClick={() => { setEditingBarcode(null); setIsAdding(false); }} style={{ background: 'var(--error)', border: 'none', borderRadius: '8px', padding: '6px', color: 'white', cursor: 'pointer' }}><X size={16} /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => handleEdit(p)} style={{ background: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '8px', padding: '6px', color: 'var(--text-primary)', cursor: 'pointer' }}><Edit3 size={16} /></button>
                                                    <button onClick={() => handleDelete(p.barcode)} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', padding: '6px', color: 'var(--error)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {isAdding && (
                                <tr style={{ background: 'rgba(245, 130, 32, 0.05)' }}>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div onClick={startCamera} style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#333', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {editForm.images && editForm.images.length > 0 ? (
                                                <img src={editForm.images[editForm.images.length - 1]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : editForm.image ? (
                                                <img src={editForm.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : <Camera size={20} color="#666" />}
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <input type="text" className="input-field" placeholder="Barcode" value={editForm.barcode} onChange={e => setEditForm({ ...editForm, barcode: e.target.value })} />
                                            <button onClick={handleScanBarcode} style={{ background: 'var(--brand-blue)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer' }}>
                                                <Camera size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <input type="text" className="input-field" placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                    </td>
                                    <td style={{ padding: '16px 20px' }}>
                                        <input type="number" className="input-field" placeholder="Price" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: parseInt(e.target.value) })} />
                                    </td>
                                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={handleSave} style={{ background: 'var(--success)', border: 'none', borderRadius: '8px', padding: '6px', color: 'white', cursor: 'pointer' }}><Plus size={16} /></button>
                                            <button onClick={() => setIsAdding(false)} style={{ background: 'var(--error)', border: 'none', borderRadius: '8px', padding: '6px', color: 'white', cursor: 'pointer' }}><X size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '500px', borderRadius: '12px' }} />
                    <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
                        <button onClick={capturePhoto} className="btn btn-primary" style={{ padding: '15px 40px', borderRadius: '30px' }}>CAPTURE PRODUCT IMAGE</button>
                        <button onClick={() => { setShowCamera(false); if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); }} className="btn btn-secondary">CANCEL</button>
                    </div>
                </div>
            )}

            {/* Existing Scanner Modal ... */}
            {showScanner && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.9)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{ color: 'white', marginBottom: '20px', textAlign: 'center' }}>
                        <h3 style={{ margin: 0 }}>Scan Barcode</h3>
                        <p style={{ opacity: 0.7, fontSize: '14px' }}>Align barcode within the frame</p>
                    </div>

                    <div id="admin-scanner-reader" style={{
                        width: '100%',
                        maxWidth: '400px',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}></div>

                    <button
                        onClick={stopScanner}
                        style={{
                            marginTop: '20px',
                            padding: '12px 30px',
                            background: 'var(--brand-red)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <XCircle size={18} /> Cancel Scan
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminInventory;
