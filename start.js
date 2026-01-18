const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const logPath = path.join(__dirname, 'bot.log');
const logStream = fs.createWriteStream(logPath, { flags: 'w' });

function log(msg) {
    const text = `[Unified Start] ${new Date().toISOString()} - ${msg}\n`;
    logStream.write(text);
    process.stdout.write(text);
}

log("Listing directory contents for debugging...");
try {
    const files = fs.readdirSync(__dirname);
    log(`Contents of ${__dirname}: ${files.join(', ')}`);
} catch (e) {
    log(`Error listing dir: ${e.message}`);
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

function spawnBot() {
    // Try venv paths first (Render/Docker/Nixpacks), then python3, then python
    const cmds = ['/opt/venv/bin/python', './.venv/bin/python', 'python3', 'python'];
    let currentCmdIndex = 0;

    function trySpawn(index) {
        const cmd = cmds[index];
        log(`Attempting to spawn bot with: ${cmd}...`);

        const p = spawn(cmd, ['-u', 'bot.py'], {
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
            if (err.code === 'ENOENT' && index < cmds.length - 1) {
                log(`${cmd} not found, trying ${cmds[index + 1]}...`);
                // Note: trySpawn will be called after this error if we structure it right
            } else {
                log(`BOT CRITICAL ERROR (${cmd}): ${err.message}`);
            }
        });

        p.on('exit', (code) => {
            log(`Bot process (${cmd}) exited with code ${code}`);
            if (code !== 0 && index < cmds.length - 1) {
                log(`Retrying with next command: ${cmds[index + 1]}...`);
                trySpawn(index + 1);
            }
        });

        return p;
    }

    return trySpawn(0);
}

bot = spawnBot();

log("Both processes initiated. Monitoring...");
