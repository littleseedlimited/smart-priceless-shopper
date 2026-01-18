import logging
import os
import sys

# 🔍 STARTUP DEBUGGING (For Render)
print(f"--- BOT SYSTEM DEBUG ---")
print(f"Python Executable: {sys.executable}")
print(f"Python Version: {sys.version}")
print(f"System Path: {sys.path}")
print(f"Environment PATH: {os.environ.get('PATH')}")
print(f"------------------------")

try:
    import requests
    print("SUCCESS: 'requests' is available.")
except Exception as e:
    print(f"CRITICAL: 'requests' import failed - {e}")
# import cv2
# import numpy as np
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo, constants
from telegram.ext import (
    ApplicationBuilder, CommandHandler, ContextTypes, MessageHandler, 
    filters, CallbackQueryHandler, ConversationHandler
)
from dotenv import load_dotenv
# import pandas as pd
import io
import json
import time
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

load_dotenv()

# --- Configuration ---
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8572310430:AAG_PxjRMAiAFWtLN0f7SfD4yEWD5l3qnas")

# Default API_BASE to localhost for internal Render/Railway communication,
# but fallback to the public URL for external/optional config.
# WEB_APP_URL MUST be public for the Telegram client to open it.
API_BASE = os.getenv("API_BASE", "http://localhost:5000")
API_URL = f"{API_BASE}/api"
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://smart-priceless-shopper.onrender.com")
SCANNER_URL = f"{WEB_APP_URL}/scanner.html"

# Conversation States
REG_NAME, REG_PHONE, REG_EMAIL, LOGIN_CODE = range(4)

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler("bot.log"),
        logging.StreamHandler()
    ]
)

# --- Helpers ---

def smart_request(method, endpoint, **kwargs):
    """
    Tries internal localhost first (fastest for Render), 
    then falls back to the public API_BASE.
    """
    # 1. Try Localhost
    local_url = f"http://localhost:5000/api{endpoint}"
    try:
        res = requests.request(method, local_url, timeout=3, **kwargs)
        if res.status_code < 500: return res
    except:
        pass

    # 2. Try Public URL
    public_url = f"{API_URL}{endpoint}" 
    try:
        return requests.request(method, public_url, timeout=10, **kwargs)
    except Exception as e:
        logging.error(f"Network Error for {endpoint}: {e}")
        raise e

async def is_authenticated(user_id):
    try:
        res = smart_request("GET", f"/users/check/{user_id}").json()
        return res.get('registered') and res.get('loggedIn')
    except:
        return False

async def get_user_status(user_id):
    try:
        return smart_request("GET", f"/users/check/{user_id}").json()
    except:
        return {"registered": False}

def get_recommendations(current_product, all_products):
    category = current_product.get('category')
    barcode = current_product.get('barcode')
    related = [p for p in all_products if p.get('category') == category and p.get('barcode') != barcode]
    if len(related) < 1:
        related = [p for p in all_products if p.get('barcode') != barcode][:2]
    return related[:3]

# --- Registration Flow ---

async def ping(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("🏓 Pong! Bot is alive and well.")

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    status = await get_user_status(user_id)
    
    if not status.get('registered'):
        await update.message.reply_text(
            "🔴🔵🟠 *Priceless Smart Shopper* 🔴🔵🟠\n\n"
            "Welcome! To start shopping, please complete a quick registration.\n\n"
            "What is your **Full Name**?",
            parse_mode='Markdown'
        )
        return REG_NAME
    
    if not status.get('loggedIn'):
        await update.message.reply_text(
            "🔐 *Secure Login Required*\n"
            "Please enter your **6-digit security code** to unlock your shopper account.",
            parse_mode='Markdown'
        )
        return LOGIN_CODE

    # Already logged in
    user_id = update.effective_user.id
    scanner_url_with_user = f"{SCANNER_URL}?userId={user_id}"
    
    reply_keyboard = [
        [KeyboardButton("📸 Scan Item", web_app=WebAppInfo(url=scanner_url_with_user))],
        ["🛒 My Cart"],
        ["📜 History", "👤 Profile"]
    ]
    markup = ReplyKeyboardMarkup(reply_keyboard, resize_keyboard=True)
    await update.message.reply_text(
        f"Welcome back, *{status.get('name')}*! Ready to shop? 🛍️",
        reply_markup=markup,
        parse_mode='Markdown'
    )
    return ConversationHandler.END

async def reg_name(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['reg_name'] = update.message.text
    await update.message.reply_text("Great! Now, what is your **Phone Number**? (with country code)", parse_mode='Markdown')
    return REG_PHONE

async def reg_phone(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['reg_phone'] = update.message.text
    await update.message.reply_text("Finally, what is your **Email Address**?", parse_mode='Markdown')
    return REG_EMAIL

async def reg_email(update: Update, context: ContextTypes.DEFAULT_TYPE):
    context.user_data['reg_email'] = update.message.text
    
    # Register in backend
    payload = {
        "userId": update.effective_user.id,
        "name": context.user_data['reg_name'],
        "phone": context.user_data['reg_phone'],
        "email": context.user_data['reg_email']
    }
    
    try:
        res = smart_request("POST", "/users/register", json=payload).json()
        code = res.get('loginCode')
        
        await update.message.reply_text(
            "🎉 *Registration Successful!* 🎉\n\n"
            f"Your unique 6-digit security code is:\n"
            f"👉 ` {code} ` 👈\n\n"
            "⚠️ **IMPORTANT:** Keep this code safe. You will need it to login every time you shop.\n\n"
            "You are now logged in! Tap 'Scan Item' to start. 🛍️",
            parse_mode='Markdown',
            reply_markup=ReplyKeyboardMarkup([
                [KeyboardButton("📸 Scan Item", web_app=WebAppInfo(url=SCANNER_URL))],
                ["🛒 My Cart"], ["📜 History", "👤 Profile"]
            ], resize_keyboard=True)
        )
    except Exception as e:
        await update.message.reply_text(f"Registration Error: {e}")
    
    return ConversationHandler.END

async def handle_login(update: Update, context: ContextTypes.DEFAULT_TYPE):
    code = update.message.text
    user_id = update.effective_user.id
    
    try:
        res = smart_request("POST", "/users/login", json={"userId": user_id, "code": code})
        if res.status_code == 200:
            data = res.json()
            await update.message.reply_text(
                f"✅ *Login Verified!*\nWelcome back, {data['name']}.",
                parse_mode='Markdown',
                reply_markup=ReplyKeyboardMarkup([
                    [KeyboardButton("📸 Scan Item", web_app=WebAppInfo(url=SCANNER_URL))],
                    ["🛒 My Cart"], ["📜 History", "👤 Profile"]
                ], resize_keyboard=True)
            )
            return ConversationHandler.END
        else:
            await update.message.reply_text("❌ *Invalid Code.* Please try again or check your records.", parse_mode='Markdown')
            return LOGIN_CODE
    except Exception as e:
        logging.error(f"Login Error for {user_id}: {e}")
        await update.message.reply_text("Service error during login. Please try again later.")
        return ConversationHandler.END

# --- Feature Handlers (Auth Guarded) ---

async def auth_guard(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await is_authenticated(update.effective_user.id):
        await update.message.reply_text("🔒 Please run /start to login first.")
        return False
    return True

async def process_barcode_logic(barcode, update, context):
    if not await auth_guard(update, context): return
    
    try:
        if barcode.startswith("http"):
            await update.message.reply_text("🌐 Website link detected. Please scan product barcode! 🛍️", parse_mode='Markdown')
            return

        response = smart_request("GET", f"/products/{barcode}")
        if response.status_code == 200:
            product = response.json()
            all_products = []
            try: all_products = smart_request("GET", "/products/all").json()
            except: pass
            
            recommendations = get_recommendations(product, all_products)
            msg = f"📦 *{product['name']}*\n💰 *Price:* ₦{product['price']:,}\n\n"
            
            cart = context.user_data.get('cart', [])
            in_cart = any(item['barcode'] == barcode for item in cart)
            
            keyboard = []
            if in_cart:
                keyboard.append([InlineKeyboardButton(f"❌ Remove {product['name']}", callback_data=f"rem_{barcode}")])
                keyboard.append([InlineKeyboardButton(f"➕ Add Another", callback_data=f"add_{barcode}")])
            else:
                keyboard.append([InlineKeyboardButton(f"✅ Add to Cart", callback_data=f"add_{barcode}")])
            
            keyboard.append([InlineKeyboardButton("🛒 View Cart", callback_data="view_cart")])
            await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        else:
            await update.message.reply_text(f"🤔 *Item not in database.* (`{barcode}`)", parse_mode='Markdown')
    except Exception as e:
        await update.message.reply_text(f"⚠️ Service error: {e}")

async def show_cart(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await auth_guard(update, context): return
    user_id = update.effective_user.id
    query = update.callback_query
    
    try:
        # Fetch cart from backend
        res = requests.get(f"{API_URL}/cart/{user_id}")
        cart = res.json()
        
        if not cart:
            msg = "🛒 Your cart is empty! Start scanning items to add them. 🛍️"
            if query: await query.edit_message_text(msg)
            else: await update.message.reply_text(msg)
            return
            
        total = sum((item['price'] * item.get('quantity', 1)) for item in cart)
        msg = "🛒 *YOUR PRICELESS CART*\n\n"
        for i, item in enumerate(cart, 1):
            qty = item.get('quantity', 1)
            price = item['price']
            subtotal = price * qty
            msg += f"{i}. *{item['name']}* x{qty} - ₦{subtotal:,}\n"
        
        msg += f"\n💰 *TOTAL:* ₦{total:,}"
        
        keyboard = [
            [InlineKeyboardButton("💳 PROCEED TO PAYMENT", callback_data="checkout")],
            [InlineKeyboardButton("🗑️ CLEAR CART", callback_data="clear_cart")]
        ]
        
        if query: await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        else: await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    except Exception as e:
        await update.message.reply_text(f"⚠️ Error fetching cart: {e}")

async def show_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not await auth_guard(update, context): return
    user = update.effective_user
    msg = f"👤 *PROFILE*\n🆔 ID: `{user.id}`\n👤 Name: {user.full_name}\n"
    keyboard = []
    if user.username == 'origichidiah':
        msg += "👑 SUPER ADMIN"
        keyboard.append([InlineKeyboardButton("🛠️ Admin Console", web_app=WebAppInfo(url=f"{WEB_APP_URL}/admin"))])
    
    await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard) if keyboard else None)

async def handle_web_app_data(update: Update, context: ContextTypes.DEFAULT_TYPE):
    data = update.effective_message.web_app_data.data
    if data == "VIEW_CART":
        await show_cart(update, context)
    else:
        await process_barcode_logic(data, update, context)

async def handle_text_messages(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    
    # Handle Staff Stock Search
    if context.user_data.get('searching_stock'):
        context.user_data['searching_stock'] = False
        try:
            # First try as barcode, then as name
            res = requests.get(f"{API_URL}/products/{text}")
            if res.status_code == 200:
                p = res.json()
                msg = f"🔍 *STOCK FOUND (Barcode)*\n📦 *{p['name']}*\n💰 Price: ₦{p['price']:,}\n📂 Category: {p['category']}"
                await update.message.reply_text(msg, parse_mode='Markdown')
                return
            
            # Search by name
            all_p = requests.get(f"{API_URL}/products/all").json()
            matches = [p for p in all_p if text.lower() in p['name'].lower()]
            if matches:
                msg = "🔍 *STOCK FOUND (Name Match)*\n\n"
                for p in matches[:5]:
                    msg += f"📦 *{p['name']}*\n💰 Price: ₦{p['price']:,}\n🔗 Barcode: `{p['barcode']}`\n\n"
                await update.message.reply_text(msg, parse_mode='Markdown')
            else:
                await update.message.reply_text("❌ No items found matching that name or barcode.")
        except:
            await update.message.reply_text("⚠️ Error searching inventory.")
        return

    # Existing menu handlers
    if text == '🛒 My Cart': await show_cart(update, context)
    elif text == '👤 Profile': await show_profile(update, context)
    elif text == '📜 History': await update.message.reply_text("📜 *PURCHASE HISTORY*\n\n1. Nestlé Milo - ₦2,500\n2. Peak Milk - ₦1,800\n\n_Feature in development..._", parse_mode='Markdown')

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data
    await query.answer()
    
    if data.startswith('add_'):
        barcode = data.split('_')[1]
        try:
            res = requests.get(f"{API_URL}/products/{barcode}").json()
            if 'cart' not in context.user_data: context.user_data['cart'] = []
            context.user_data['cart'].append(res)
            await query.edit_message_text(f"✅ Added *{res['name']}* to your cart.", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 VIEW CART", callback_data="view_cart")]]))
        except: pass
    elif data.startswith('rem_'):
        barcode = data.split('_')[1]
        if 'cart' in context.user_data:
            # Find the first item with this barcode and remove it
            for i, item in enumerate(context.user_data['cart']):
                if item['barcode'] == barcode:
                    removed = context.user_data['cart'].pop(i)
                    await query.edit_message_text(f"❌ Removed *{removed['name']}* from your cart.", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🛒 VIEW CART", callback_data="view_cart")]]))
                    break
    elif data == 'view_cart':
        await show_cart(update, context)
    elif data == 'checkout':
        # Show payment method selection
        user_id = query.from_user.id
        try:
            cart = requests.get(f"{API_URL}/cart/{user_id}").json()
            total = sum((item['price'] * item.get('quantity', 1)) for item in cart)
            
            msg = (
                "💳 *SELECT PAYMENT METHOD*\n\n"
                f"📦 Items: {len(cart)}\n"
                f"💰 Total: ₦{total:,}\n\n"
                "Choose how you want to pay:"
            )
            
            keyboard = [
                [InlineKeyboardButton("⭐ Telegram Stars", callback_data=f"pay_stars_{total}")],
                [InlineKeyboardButton("💳 Debit/Credit Card", callback_data=f"pay_card_{total}")],
                [InlineKeyboardButton("🏦 Paystack", callback_data=f"pay_paystack_{total}")],
                [InlineKeyboardButton("🏧 Bank Transfer", callback_data=f"pay_bank_{total}")],
                [InlineKeyboardButton("⬅️ Back to Cart", callback_data="view_cart")]
            ]
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
        except Exception as e:
            await query.edit_message_text(f"⚠️ Error loading checkout: {e}")
    
    elif data == 'clear_cart':
        user_id = query.from_user.id
        try:
            requests.post(f"{API_URL}/cart/clear", json={"userId": user_id})
            await query.edit_message_text("🗑️ Your cart has been cleared.")
        except:
            await query.edit_message_text("⚠️ Error clearing cart.")
    
    elif data.startswith('pay_stars_'):
        amount = int(data.split('_')[2])
        # Placeholder for Telegram Stars payment
        msg = (
            "⭐ *TELEGRAM STARS PAYMENT*\n\n"
            f"💰 Amount: ₦{amount:,}\n"
            f"⭐ Stars Required: {amount // 50} Stars\n\n"
            "🔧 _This payment method is coming soon!_\n"
            "_Telegram Stars integration requires bot payment setup with @BotFather._"
        )
        keyboard = [[InlineKeyboardButton("⬅️ Back to Payment Methods", callback_data="checkout")]]
        await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    
    elif data.startswith('pay_card_'):
        amount = int(data.split('_')[2])
        # Placeholder for Card payment via Paystack
        msg = (
            "💳 *DEBIT/CREDIT CARD PAYMENT*\n\n"
            f"💰 Amount: ₦{amount:,}\n\n"
            "🔧 _This payment method is coming soon!_\n"
            "_Card payments will be processed via Paystack._\n\n"
            "Supported Cards:\n"
            "• Visa\n"
            "• Mastercard\n"
            "• Verve"
        )
        keyboard = [[InlineKeyboardButton("⬅️ Back to Payment Methods", callback_data="checkout")]]
        await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    
    elif data.startswith('pay_paystack_'):
        amount = int(data.split('_')[2])
        # Placeholder for Paystack payment
        msg = (
            "🏦 *PAYSTACK PAYMENT*\n\n"
            f"💰 Amount: ₦{amount:,}\n\n"
            "🔧 _This payment method is coming soon!_\n"
            "_Paystack supports Cards, Bank Transfer, USSD, and QR._\n\n"
            "To enable:\n"
            "1. Create a Paystack account\n"
            "2. Add your Secret Key to .env\n"
            "3. Configure webhook URL"
        )
        keyboard = [[InlineKeyboardButton("⬅️ Back to Payment Methods", callback_data="checkout")]]
        await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    
    elif data.startswith('pay_bank_'):
        amount = int(data.split('_')[2])
        user_id = query.from_user.id
        ref_code = f"PSS-{user_id}-{int(time.time())}"
        
        # Bank Transfer with reference code
        msg = (
            "🏧 *BANK TRANSFER PAYMENT*\n\n"
            f"💰 Amount: ₦{amount:,}\n\n"
            "*Bank Details:*\n"
            "🏦 Bank: _[Bank Name Placeholder]_\n"
            "📋 Account: _[Account Number Placeholder]_\n"
            "👤 Name: _[Account Name Placeholder]_\n\n"
            f"*Your Reference:* `{ref_code}`\n\n"
            "⚠️ _Please include the reference code in your transfer narration._\n\n"
            "_After payment, an admin will verify and process your order._"
        )
        keyboard = [
            [InlineKeyboardButton("✅ I've Paid", callback_data=f"confirm_bank_{ref_code}")],
            [InlineKeyboardButton("⬅️ Back to Payment Methods", callback_data="checkout")]
        ]
        await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    
    elif data.startswith('confirm_bank_'):
        ref_code = data.replace('confirm_bank_', '')
        user_id = query.from_user.id
        
        try:
            # Fetch cart items
            cart_res = smart_request("GET", f"/cart/{user_id}")
            cart_data = cart_res.json()
            
            if not cart_data or not cart_data.get('items'):
                await query.edit_message_text("⚠️ Your cart is empty. Please add items before paying.")
                return

            # Create Order
            order_data = {
                "userId": user_id,
                "items": cart_data['items'],
                "total": cart_data['total'],
                "paymentMethod": "Bank Transfer",
                "paymentRef": ref_code
            }
            
            smart_request("POST", "/orders", json=order_data)

            msg = (
                "✅ *PAYMENT CONFIRMED & ORDER PLACED*\n\n"
                f"Receipt Reference: `{ref_code}`\n\n"
                "Receipt initiated! You can view and print your receipt in the shopper dashboard.\n\n"
                "🕐 Our staff will verify the transfer and prepare your items for pickup."
            )
            
            keyboard = [[InlineKeyboardButton("📜 View Digital Receipt", web_app=WebAppInfo(url=f"{WEB_APP_URL}/history"))]]
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
            
        except Exception as e:
            print(f"Checkout Error: {e}")
            await query.edit_message_text("⚠️ Error processing your receipt. Please contact support.")
    
    elif data == 'clear_cart':
        user_id = query.from_user.id
        smart_request("POST", "/cart/clear", json={"userId": user_id})
        await query.edit_message_text("🗑️ Cart cleared!")
    
    elif data == 'admin_stats':
        try:
            res = smart_request("GET", "/admin/stats", headers={'x-admin-username': 'origichidiah'}).json()
            msg = (
                "📊 *REAL-TIME ANALYTICS*\n\n"
                f"💰 Total Sales: ₦{res['totalSales']:,}\n"
                f"📦 Orders: {res['totalOrders']}\n"
                f"👤 Users: {res['userCount']}\n"
                f"🛠️ Staff: {res['staffCount']}"
            )
            await query.edit_message_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Back to Admin", callback_data="back_admin")]]))
        except:
            await query.edit_message_text("⚠️ Error fetching analytics.")
    elif data == 'back_admin':
        # Reuse admin_menu logic but for callback
        keyboard = [
            [InlineKeyboardButton("🖥️ Open Full Dashboard", web_app=WebAppInfo(url=f"{WEB_APP_URL}/admin"))],
            [InlineKeyboardButton("📦 Manual Inventory", web_app=WebAppInfo(url=f"{WEB_APP_URL}/admin?tab=inventory"))],
            [InlineKeyboardButton("👥 Manage Staff Roles", web_app=WebAppInfo(url=f"{WEB_APP_URL}/admin?tab=staff"))],
            [InlineKeyboardButton("📊 Refresh Analytics", callback_data="admin_stats")]
        ]
        await query.edit_message_text("👑 *SUPER ADMIN CONSOLE*\nSelect an action below.", parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    elif data == 'staff_stock':
        await query.edit_message_text("🔍 To check stock, please send the **Barcode** or **Name** of the item you're looking for.")
        context.user_data['searching_stock'] = True
    elif data == 'staff_orders':
        await query.edit_message_text("📜 *RECENT ORDERS*\nFetching last 5 transactions...", parse_mode='Markdown')
        # Logic to fetch and display orders could be added here

# --- Admin & Staff Command Handlers ---

async def admin_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.username != 'origichidiah':
        await update.message.reply_text("⛔ *Access Denied:* This command is reserved for the Super Admin.")
        return

    msg = (
        "👑 *SUPER ADMIN CONSOLE*\n\n"
        "1. **Bulk Upload**: Send me a `.csv`, `.xlsx`, or `.json` file to update inventory.\n"
        "2. **Manual**: Use the dashboard for fine-grained control.\n"
        "3. **Samples**: Download templates from the dashboard."
    )
    
    keyboard = [
        [InlineKeyboardButton("🖥️ Open Full Dashboard", web_app=WebAppInfo(url=f"{WEB_APP_URL}/admin"))],
        [InlineKeyboardButton("📦 Manual Inventory", web_app=WebAppInfo(url=f"{WEB_APP_URL}/admin?tab=inventory"))],
        [InlineKeyboardButton("📊 Refresh Analytics", callback_data="admin_stats")]
    ]
    
    await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))

async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    if user.username != 'origichidiah': return
    await update.message.reply_text("📦 *Bulk Upload:* Temporarily disabled for performance optimization. Please use the web dashboard.")

async def staff_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    try:
        # Check backend for staff role
        res = smart_request("GET", "/admin/staff", headers={'x-admin-username': 'origichidiah'}) # Using super admin to fetch list
        staff_list = res.json()
        is_staff = any(s['username'] == user.username for s in staff_list) or user.username == 'origichidiah'
        
        if not is_staff:
            await update.message.reply_text("🚫 *Access Denied:* You are not registered as a staff member.")
            return

        msg = (
            "🛠️ *STAFF COMMAND CENTER*\n"
            "Use the buttons below for store operations."
        )
        
        keyboard = [
            [InlineKeyboardButton("📸 Exit Verification", web_app=WebAppInfo(url=f"{WEB_APP_URL}/staff"))],
            [InlineKeyboardButton("📦 Check Product Stock", callback_data="staff_stock")],
            [InlineKeyboardButton("🗂️ View Recent Orders", callback_data="staff_orders")]
        ]
        
        await update.message.reply_text(msg, parse_mode='Markdown', reply_markup=InlineKeyboardMarkup(keyboard))
    except Exception as e:
        await update.message.reply_text("⚠️ Error connecting to staff database.")

# --- Main ---

def log_info(msg):
    logging.info(msg)
    print(msg)

if __name__ == '__main__':
    log_info("--- Bot Process Started ---")
    masked_token = f"{TOKEN[:5]}...{TOKEN[-5:]}" if TOKEN else "None"
    log_info(f"Using Token: {masked_token}")
    log_info(f"API_BASE: {API_BASE}")
    
    try:
        application = ApplicationBuilder().token(TOKEN).build()
        
        # Registration Handler
        reg_handler = ConversationHandler(
            entry_points=[CommandHandler('start', start)],
            states={
                REG_NAME: [MessageHandler(filters.TEXT & ~(filters.COMMAND), reg_name)],
                REG_PHONE: [MessageHandler(filters.TEXT & ~(filters.COMMAND), reg_phone)],
                REG_EMAIL: [MessageHandler(filters.TEXT & ~(filters.COMMAND), reg_email)],
                LOGIN_CODE: [MessageHandler(filters.Regex(r'^\d{6}$'), handle_login)]
            },
            fallbacks=[CommandHandler('start', start)]
        )
        
        application.add_handler(reg_handler)
        application.add_handler(CommandHandler('ping', ping))
        application.add_handler(CommandHandler('admin', admin_menu))
        application.add_handler(CommandHandler('staff', staff_menu))
        application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, handle_web_app_data))
        application.add_handler(CallbackQueryHandler(button_handler))
        application.add_handler(MessageHandler(filters.Document.ALL, handle_document))
        application.add_handler(MessageHandler(filters.TEXT & ~(filters.COMMAND), handle_text_messages))
        
        print("Priceless Secure Bot is LIVE and preparing to start polling...")
        
        # ⏱️ Slight delay to ensure the backend web server has bound to the port first
        print("Waiting 10 seconds for backend initialization...")
        time.sleep(10)
        
        print("Bot is starting polling now.")
        application.run_polling()
    except Exception as e:
        print(f"CRITICAL BOT ERROR: {e}")
        # Keep process alive so Render doesn't loop forever, but logged error is clear
        time.sleep(3600)
