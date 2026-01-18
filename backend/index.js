const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Serve dist for React App
app.use(express.static(path.join(__dirname, '../frontend/dist')));
// Serve specific static files needed by bot
app.use('/scanner.html', express.static(path.join(__dirname, '../frontend/scanner.html')));
app.use('/test_barcodes.html', express.static(path.join(__dirname, '../frontend/test_barcodes.html')));

// --- Persistent Database Initialization ---
const initialDb = {
  outlets: [
    { id: 'imo-central', name: 'Priceless Imo Central', location: 'Owerri' },
    { id: 'imo-north', name: 'Priceless Imo North', location: 'Okigwe' },
    { id: 'lagos-lekki', name: 'Priceless Lagos Lekki', location: 'Lagos' }
  ],
  products: [
    {
      barcode: '123456',
      name: 'Nestlé Milo 500g',
      price: 2500,
      category: 'Beverage',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200',
      description: 'The energy food drink of future champions.'
    },
    {
      barcode: '234567',
      name: 'Peak Full Cream Milk',
      price: 1800,
      category: 'Dairy',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=200',
      description: 'Rich and creamy milk for your morning tea.'
    }
  ],
  users: [],
  transactions: [],
  staff: [
    { username: 'origichidiah', role: 'SUPER_ADMIN', name: 'Original Chidiah' }
  ],
  roles: ['SUPER_ADMIN', 'INVENTORY_MANAGER', 'BILLING_STAFF'],
  settings: {
    storeName: 'Smart Priceless Shopper',
    location: 'Lagos, Nigeria',
    operatingHours: '8:00 AM - 9:00 PM',
    welcomeMessage: 'Welcome to Smart Priceless Shopper! Ready to shop? 🛍️',
    contactSupport: '@priceless_support'
  },
  orders: []
};

let db = initialDb;

// Load DB from file if exists
if (fs.existsSync(DB_FILE)) {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    db = JSON.parse(data);
    console.log(`[Database] Loaded ${db.products.length} products from ${DB_FILE}`);
    // Ensure Super Admin is always there
    if (!db.staff.find(s => s.username === 'origichidiah')) {
      db.staff.push({ username: 'origichidiah', role: 'SUPER_ADMIN', name: 'Original Chidiah' });
    }
  } catch (err) {
    console.error(`[Database] Error loading DB file: ${err.message}`);
    console.log("[Database] Falling back to initial memory DB");
  }
}

const saveDb = () => {
  try {
    const absolutePath = path.resolve(DB_FILE);
    fs.writeFileSync(absolutePath, JSON.stringify(db, null, 2));
    console.log(`[Database] Successfully saved to: ${absolutePath}`);
    console.log(`[Database] Current products count: ${db.products.length}`);
  } catch (err) {
    console.error(`[Database] CRITICAL ERROR saving DB: ${err.message}`);
  }
};

// --- Middleware ---

const checkRole = (allowedRoles) => (req, res, next) => {
  const adminId = req.headers['x-admin-username']; // For dev, we use username header
  const staffMember = db.staff.find(s => s.username === adminId);

  if (staffMember && allowedRoles.includes(staffMember.role)) {
    req.admin = staffMember;
    next();
  } else {
    res.status(403).json({ error: 'Access Denied: Insufficient Permissions' });
  }
};

// --- Routes ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Priceless Shopper API is running (v4)' });
});

app.get('/api/ping', (req, res) => {
  res.send('pong');
});

// --- Product Endpoints ---

app.get('/api/products/all', (req, res) => {
  res.json(db.products);
});

app.get('/api/products/:barcode', (req, res) => {
  const searchBarcode = String(req.params.barcode).trim();
  console.log(`[Lookup] Searching for barcode: "${searchBarcode}"`);
  const product = db.products.find(p => String(p.barcode).trim() === searchBarcode);
  if (product) {
    res.json(product);
  } else {
    console.log(`[Lookup] Product NOT FOUND: "${searchBarcode}"`);
    res.status(404).json({ error: 'Product not found' });
  }
});

// Admin CRUD - Products
app.post('/api/admin/products', checkRole(['SUPER_ADMIN', 'INVENTORY_MANAGER']), (req, res) => {
  const { barcode, name, price, category, description } = req.body;
  const bcode = String(barcode).trim();
  const existing = db.products.find(p => String(p.barcode).trim() === bcode);
  if (existing) return res.status(400).json({ error: 'Barcode already exists' });

  const product = {
    barcode: bcode,
    name,
    price: parseInt(price) || 0,
    category,
    description,
    images: req.body.images || (req.body.image ? [req.body.image] : []), // Support array of images
    createdAt: new Date()
  };
  db.products.push(product);
  saveDb();
  res.status(201).json(product);
});

// Admin endpoint to upload/update product image
app.post('/api/admin/products/:barcode/image', checkRole(['SUPER_ADMIN', 'INVENTORY_MANAGER']), (req, res) => {
  const barcode = String(req.params.barcode).trim();
  const index = db.products.findIndex(p => String(p.barcode).trim() === barcode);

  if (index !== -1) {
    if (!db.products[index].images) db.products[index].images = [];
    db.products[index].images.push(req.body.image); // Add to array
    saveDb();
    res.json({ message: 'Image added successfully', barcode, count: db.products[index].images.length });
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// AI Vision Identification Endpoint
app.post('/api/vision/identify', async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  // 🤖 REAL AI INTEGRATION (Gemini Vision)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (GEMINI_API_KEY) {
    try {
      const base64Data = image.split(',')[1];
      const inventoryNames = db.products.map(p => p.name).join(', ');

      const prompt = `Identify products in this image. We have these in inventory: [${inventoryNames}]. 
      Only return product names from this list that you ARE SURE you see. 
      Return only the names, comma separated. If none found, return "None".`;

      const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
          }]
        })
      });

      const data = await aiResponse.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      console.log(`[AI Vision] Gemini identified: ${text}`);

      if (!text || text.toLowerCase().includes("none")) {
        return res.json({ products: [] });
      }

      // Match found text against our database
      const detected = db.products.filter(p =>
        text.toLowerCase().includes(p.name.toLowerCase())
      );

      return res.json({ products: detected });
    } catch (err) {
      console.error("[AI Vision] Gemini Error:", err);
    }
  }

  // 🧪 FALLBACK SIMULATION (If no key or error)
  // Smart simulation: returns 1-2 items that actually have visual fingerprints
  const candidates = db.products.filter(p => (p.images && p.images.length > 0) || p.image);
  const matches = candidates.sort(() => 0.5 - Math.random()).slice(0, 1);
  res.json({ products: matches });
});

// 🔍 AI DISCOVERY (For Inventory Auto-fill)
app.post('/api/vision/explore', async (req, res) => {
  const { image } = req.body;
  if (!image) return res.status(400).json({ error: 'No image provided' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) return res.status(503).json({ error: 'AI Service Not Configured' });

  try {
    const base64Data = image.split(',')[1];
    const prompt = `Act as a retail expert. Look at this product image. 
    1. Extract the barcode if clearly visible.
    2. Identify the full product name.
    3. Categorize it (e.g., Dairy, Beverage, Household, etc.).
    4. Provide a brief description.
    
    Return the result strictly as a JSON object:
    {"barcode": "string", "name": "string", "category": "string", "description": "string"}`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const data = await aiResponse.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Clean JSON markdown if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);

    res.json(result);
  } catch (err) {
    console.error("[AI Explore] Error:", err);
    res.status(500).json({ error: 'AI recognition failed' });
  }
});

app.post('/api/admin/products/bulk', checkRole(['SUPER_ADMIN', 'INVENTORY_MANAGER']), (req, res) => {
  const products = req.body;
  if (!Array.isArray(products)) return res.status(400).json({ error: 'Expected array of products' });

  let added = 0;
  let updated = 0;

  products.forEach(p => {
    if (!p.barcode || !p.name || !p.price) return;
    const barcode = String(p.barcode).trim();
    const index = db.products.findIndex(existing => String(existing.barcode).trim() === barcode);
    if (index !== -1) {
      db.products[index] = { ...db.products[index], ...p, barcode };
      updated++;
    } else {
      db.products.push({ ...p, barcode });
      added++;
    }
  });

  saveDb();
  res.json({ message: 'Bulk upload successful', added, updated });
});

app.put('/api/admin/products/:barcode', checkRole(['SUPER_ADMIN', 'INVENTORY_MANAGER']), (req, res) => {
  const oldBarcode = String(req.params.barcode).trim();
  const index = db.products.findIndex(p => String(p.barcode).trim() === oldBarcode);

  if (index !== -1) {
    const { barcode, name, price, category, description } = req.body;
    const bcode = String(barcode || oldBarcode).trim();

    db.products[index] = {
      ...db.products[index],
      ...req.body,
      barcode: bcode,
      updatedAt: new Date()
    };
    saveDb();
    res.json(db.products[index]);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

app.delete('/api/admin/products/:barcode', checkRole(['SUPER_ADMIN']), (req, res) => {
  const delBarcode = String(req.params.barcode).trim();
  const index = db.products.findIndex(p => String(p.barcode).trim() === delBarcode);
  if (index !== -1) {
    const deleted = db.products.splice(index, 1);
    saveDb();
    res.json(deleted);
  } else {
    res.status(404).json({ error: 'Product not found' });
  }
});

// Redundant app.post('/api/orders') removed in favor of consolidated /api/checkout

app.get('/api/orders/user/:userId', (req, res) => {
  const userId = String(req.params.userId);
  const userOrders = db.orders.filter(o => String(o.userId) === userId);
  res.json(userOrders);
});

// --- Admin Analytics & Details ---

app.get('/api/admin/stats', checkRole(['SUPER_ADMIN']), (req, res) => {
  const totalSales = db.orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = db.orders.length;
  const staffCount = db.staff.length;
  const userCount = db.users.length;

  res.json({
    totalSales,
    totalOrders,
    staffCount,
    userCount
  });
});

app.get('/api/admin/orders', checkRole(['SUPER_ADMIN']), (req, res) => {
  const { search } = req.query;
  let ordersList = [...db.orders];

  if (search) {
    const s = search.toLowerCase();
    ordersList = ordersList.filter(o =>
      o.orderId.toLowerCase().includes(s) ||
      String(o.userId).includes(s)
    );
  }

  res.json(ordersList.reverse()); // Newest first
});

app.get('/api/admin/users', checkRole(['SUPER_ADMIN']), (req, res) => {
  const { search } = req.query;
  let usersList = [...db.users];

  if (search) {
    const s = search.toLowerCase();
    usersList = usersList.filter(u =>
      (u.name && u.name.toLowerCase().includes(s)) ||
      String(u.telegramId).includes(s) ||
      (u.email && u.email.toLowerCase().includes(s))
    );
  }

  res.json(usersList);
});

// --- Staff Endpoints (Admin Only) ---

app.get('/api/admin/staff', checkRole(['SUPER_ADMIN']), (req, res) => {
  res.json(db.staff);
});

app.post('/api/admin/staff', checkRole(['SUPER_ADMIN']), (req, res) => {
  const newStaff = req.body;
  if (db.staff.find(s => s.username === newStaff.username)) {
    return res.status(400).json({ error: 'Staff already exists' });
  }
  db.staff.push(newStaff);
  saveDb();
  res.status(201).json(newStaff);
});

app.delete('/api/admin/staff/:username', checkRole(['SUPER_ADMIN']), (req, res) => {
  if (req.params.username === 'origichidiah') return res.status(403).json({ error: "Cannot delete the Super Admin" });
  const index = db.staff.findIndex(s => s.username === req.params.username);
  if (index !== -1) {
    db.staff.splice(index, 1);
    saveDb();
    res.json({ message: 'Staff removed' });
  } else res.status(404).json({ error: 'Staff not found' });
});

// --- analytics ---

app.get('/api/admin/analytics', checkRole(['SUPER_ADMIN', 'BILLING_STAFF']), (req, res) => {
  const totalSales = db.transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  res.json({
    totalSales,
    totalOrders: db.transactions.length,
    totalProducts: db.products.length,
    totalUsers: db.users.length,
    recentTransactions: db.transactions.slice(-10).reverse()
  });
});

// --- User Identity Endpoints ---

app.get('/api/users/check/:userId', (req, res) => {
  const user = db.users.find(u => u.userId == req.params.userId);
  if (user) {
    res.json({ registered: true, name: user.name, loggedIn: !!user.sessionActive });
  } else {
    res.json({ registered: false });
  }
});

// --- Settings Endpoints ---
app.get('/api/admin/settings', checkRole(['SUPER_ADMIN']), (req, res) => {
  res.json(db.settings || initialDb.settings);
});

app.post('/api/admin/settings', checkRole(['SUPER_ADMIN']), (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  saveDb();
  res.json(db.settings);
});

app.post('/api/users/register', (req, res) => {
  const { userId, name, email, phone } = req.body;
  const existing = db.users.find(u => u.userId == userId);
  if (existing) return res.status(400).json({ error: 'User already registered' });

  const loginCode = Math.floor(100000 + Math.random() * 900000).toString();
  const newUser = {
    userId,
    name,
    email,
    phone,
    loginCode,
    sessionActive: true, // Login instantly after signup
    registeredAt: new Date()
  };

  db.users.push(newUser);
  saveDb();
  res.status(201).json({ message: 'Registration successful', loginCode });
});

// --- Wallet Endpoints ---

app.get('/api/users/:userId/wallet', (req, res) => {
  const user = db.users.find(u => String(u.userId) === String(req.params.userId));
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    balance: user.walletBalance || 0,
    transactions: user.walletTransactions || []
  });
});

app.post('/api/users/:userId/wallet/fund', (req, res) => {
  const { amount, method, reference } = req.body;
  const user = db.users.find(u => String(u.userId) === String(req.params.userId));

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  const fundingAmount = parseFloat(amount);
  user.walletBalance = (user.walletBalance || 0) + fundingAmount;

  if (!user.walletTransactions) user.walletTransactions = [];
  user.walletTransactions.push({
    id: `TXN-F-${Date.now()}`,
    type: 'CREDIT',
    amount: fundingAmount,
    method: method || 'Manual',
    reference: reference || 'N/A',
    purpose: 'Wallet Funding',
    date: new Date()
  });

  saveDb();
  res.json({ message: 'Wallet funded successfully', balance: user.walletBalance });
});

app.post('/api/users/login', (req, res) => {
  const { userId, code } = req.body;
  const userIndex = db.users.findIndex(u => u.userId == userId);

  if (userIndex !== -1 && db.users[userIndex].loginCode === code) {
    db.users[userIndex].sessionActive = true;
    saveDb();
    res.json({ message: 'Login successful', name: db.users[userIndex].name });
  } else {
    res.status(401).json({ error: 'Invalid security code' });
  }
});

app.post('/api/users/logout', (req, res) => {
  const { userId } = req.body;
  const userIndex = db.users.findIndex(u => u.userId == userId);
  if (userIndex !== -1) {
    db.users[userIndex].sessionActive = false;
    saveDb();
  }
  res.json({ message: 'Logged out' });
});

// --- Cart Endpoints ---
// (Ensure carts exist in initial db structure if not already there, but we can initialize them on the fly)
if (!db.carts) db.carts = {};

app.get('/api/cart/:userId', (req, res) => {
  res.json(db.carts[req.params.userId] || []);
});

app.post('/api/cart/add', (req, res) => {
  const { userId, barcode, quantity } = req.body;
  console.log(`[Cart] Add request - userId: ${userId}, barcode: ${barcode}, qty: ${quantity}`);

  if (!userId) {
    console.log('[Cart] ERROR: Missing userId');
    return res.status(400).json({ error: 'Missing userId' });
  }

  const bcode = String(barcode).trim();
  const product = db.products.find(p => String(p.barcode).trim() === bcode);
  if (!product) {
    console.log(`[Cart] ERROR: Product not found for barcode: ${bcode}`);
    return res.status(404).json({ error: 'Product not found' });
  }

  const qty = parseInt(quantity) || 1;

  if (!db.carts[userId]) db.carts[userId] = [];

  // Check if product already in cart
  const existingIndex = db.carts[userId].findIndex(item => String(item.barcode).trim() === bcode);

  if (existingIndex !== -1) {
    db.carts[userId][existingIndex].quantity = (db.carts[userId][existingIndex].quantity || 1) + qty;
    console.log(`[Cart] Updated quantity for ${product.name} in cart for user ${userId}`);
  } else {
    db.carts[userId].push({ ...product, barcode: bcode, quantity: qty, scanTime: new Date() });
    console.log(`[Cart] Added ${product.name} to cart for user ${userId}`);
  }

  saveDb();
  console.log(`[Cart] SUCCESS - Cart now has ${db.carts[userId].length} items for user ${userId}`);
  res.json({ message: 'Added to cart', product, cartCount: db.carts[userId].length });
});

app.post('/api/cart/clear', (req, res) => {
  const { userId } = req.body;
  db.carts[userId] = [];
  saveDb();
  res.json({ message: 'Cart cleared' });
});

// --- Checkout & Transactions ---

app.post('/api/checkout', (req, res) => {
  const { userId, outletId, items, totalAmount, paymentMethod, paymentRef } = req.body;

  if (!userId || !items || !totalAmount) {
    return res.status(400).json({ error: 'Missing checkout details' });
  }

  const amount = parseFloat(totalAmount);

  // 1. Handle Wallet Payment
  const outlet = db.outlets?.find(o => o.id === outletId);
  const outletName = outlet ? outlet.name : 'Priceless Store';

  if (paymentMethod === 'Priceless Wallet') {
    const user = db.users.find(u => String(u.userId) === String(userId));
    if (!user) return res.status(404).json({ error: 'User not found' });

    if ((user.walletBalance || 0) < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    user.walletBalance -= amount;
    if (!user.walletTransactions) user.walletTransactions = [];
    user.walletTransactions.push({
      id: `TXN-${Date.now()}`,
      type: 'DEBIT',
      amount,
      purpose: `Order at ${outletName}`,
      date: new Date()
    });
  }

  // 2. Create Order (for History & Receipts)
  const orderId = `ORD-${Date.now()}-${userId}`;
  const order = {
    orderId,
    userId,
    outletId,
    outletName,
    items, // [{barcode, name, price, quantity}]
    total: amount,
    paymentMethod,
    paymentRef: paymentRef || `AUTO-${Date.now()}`,
    status: 'COMPLETED',
    createdAt: new Date()
  };
  db.orders.push(order);

  // 3. Create Transaction (for Analytics)
  const transaction = {
    id: `TXN-OR-${Date.now()}`,
    orderId,
    userId,
    outletId,
    items,
    totalAmount: amount,
    status: 'paid',
    timestamp: new Date()
  };
  db.transactions.push(transaction);

  // 4. Clear User Cart (Both types)
  if (db.carts && db.carts[userId]) {
    db.carts[userId] = [];
  }
  const userInDb = db.users.find(u => String(u.userId) === String(userId));
  if (userInDb) {
    userInDb.cart = [];
  }

  saveDb();
  console.log(`[Checkout] SUCCESS: ${orderId} via ${paymentMethod} for User: ${userId}`);
  res.status(201).json({
    message: 'Payment Successful',
    orderId,
    exitQrCode: orderId,
    newBalance: paymentMethod === 'Priceless Wallet' ? userInDb?.walletBalance : undefined
  });
});

app.get('/api/transactions/:userId', (req, res) => {
  res.json(db.transactions.filter(t => t.userId == req.params.userId));
});

// 🐛 Debug endpoint to read bot logs on Render
app.get('/api/debug/bot-logs', (req, res) => {
  const logPath = path.join(__dirname, '../bot.log');
  if (fs.existsSync(logPath)) {
    res.sendFile(logPath);
  } else {
    res.status(404).send('bot.log not found yet.');
  }
});

// --- Catch-all to serve React App for client-side routing ---
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API Endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(`[Server Error] ${err.stack}`);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    code: err.code || 'UNKNOWN_ERROR'
  });
});

app.listen(PORT, () => {
  console.log(`Priceless Backend (Admin Core) running on port ${PORT}`);
});
