const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const logPath = path.join(__dirname, 'bot.log');
const logStream = fs.createWriteStream(logPath, { flags: 'w' });

function log(msg) {
    const text = `[Unified Start] ${new Date().toISOString()} - ${msg}\n`;
    console.log(text);
    logStream.write(text);
}

log("--- Starting Unified Service (Backend + Bot) ---");

// 1. Start Express Backend
log("Spawning Backend (Node.js)...");
const backend = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    env: { ...process.env, PORT: process.env.PORT || 5000 }
});

backend.on('error', (err) => {
    log(`BACKEND CRITICAL ERROR: ${err.message}`);
});

backend.on('exit', (code) => {
    log(`Backend process exited with code ${code}`);
});

// 2. Start Telegram Bot
// We try 'python3' (Render Standard) then fallback to 'python'
log("Spawning Bot (Python)...");
let bot;

function spawnBot(cmd) {
    const p = spawn(cmd, ['bot.py'], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env
    });

    p.stdout.on('data', (data) => {
        logStream.write(data);
        process.stdout.write(data);
    });

    p.stderr.on('data', (data) => {
        logStream.write(data);
        process.stderr.write(data);
    });

    p.on('error', (err) => {
        if (err.code === 'ENOENT' && cmd === 'python3') {
            log("python3 not found, falling back to 'python'...");
            bot = spawnBot('python');
        } else {
            log(`BOT ERROR (${cmd}): ${err.message}`);
        }
    });

    p.on('exit', (code) => {
        log(`Bot process (${cmd}) exited with code ${code}`);
    });

    return p;
}

bot = spawnBot('python3');

log("Both processes initiated. Monitoring...");
