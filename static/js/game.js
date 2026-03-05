// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameState = {
    snake: [],
    apples: [],
    score: 0,
    time: 0,
    game_over: false,
    game_active: false,
    width: 30,
    height: 30,
};

let settings = {
    map_size: 'small',
    snake_color: 'blue',
    speed: 'slow',
    random_controls: false,
    invisible_snake: false,
    apples_count: 1,
    background: 'white',
};

const SPEED_BASE = {
    'slow': 3,
    'medium': 5,
    'fast': 10,
};

let cellSize = 0;
let lastMoveTime = 0;
let lastDrawTime = 0;
let currentDirection = 'right';
let startTime = Date.now();
let gameActive = false;
let paused = false;
let pausedAt = null;

// Helpers for colors
function lightenHex(hex, amount) {
    // amount: 0..1
    const num = parseInt(hex.replace('#',''),16);
    let r = (num >> 16) + Math.round(255 * amount);
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * amount);
    let b = (num & 0x0000FF) + Math.round(255 * amount);
    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6,'0');
}

function darkenHex(hex, amount) {
    const num = parseInt(hex.replace('#',''),16);
    let r = (num >> 16) - Math.round(255 * amount);
    let g = ((num >> 8) & 0x00FF) - Math.round(255 * amount);
    let b = (num & 0x0000FF) - Math.round(255 * amount);
    r = Math.max(0, r);
    g = Math.max(0, g);
    b = Math.max(0, b);
    return '#' + (r << 16 | g << 8 | b).toString(16).padStart(6,'0');
}

// Initialize game
async function initGame() {
    // Load settings
    await loadSettings();
    
    // Apply background
    document.body.style.background = settings.background || 'white';

    // Start the game
    await startGame();
    
    // Setup event listeners
    document.addEventListener('keydown', handleKeyPress);
    
    // Setup canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start game loop
    lastMoveTime = 0;
    paused = false;
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 300);
    // Make squares slightly larger while ensuring the grid fits
    let tentative = Math.floor(maxSize / gameState.width) + 1; // try +1 pixel per cell
    if (tentative * gameState.width > maxSize) tentative = Math.floor(maxSize / gameState.width);
    cellSize = Math.max(1, tentative);
    canvas.width = cellSize * gameState.width;
    canvas.height = cellSize * gameState.height;
}

async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        settings = Object.assign(settings, data);
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function startGame() {
    try {
        const response = await fetch('/api/game/start', {
            method: 'POST',
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            await updateGameState();
            // Ensure apples match desired count from settings (in case of desync)
            const desired = parseInt(settings.apples_count || 1, 10);
            localSpawnApples(Math.max(0, desired - (gameState.apples ? gameState.apples.length : 0)));

            gameActive = true;
            startTime = Date.now();
            paused = false;
            document.getElementById('gameOverScreen').style.display = 'none';
            document.getElementById('pauseBtn').textContent = '⏸️ PAUSE';

            // Ensure submit UI hidden until Game Over check
            const submitContainer = document.querySelector('.submit-score');
            if (submitContainer) submitContainer.style.display = 'none';
            const submitBtn = document.getElementById('submitScoreBtn');
            if (submitBtn) submitBtn.disabled = true;
            const notMsg = document.getElementById('notTop5Msg');
            if (notMsg) notMsg.remove();

            // Load leaderboard so it's ready during the session
            await fetchLeaderboard();
        }
    } catch (error) {
        console.error('Error starting game:', error);
    }
} 

async function updateGameState() {
    try {
        const response = await fetch('/api/game/state');
        const data = await response.json();
        gameState = data;
        
        // Update UI
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('time').textContent = gameState.time + 's';
        // Resize canvas when map changes
        resizeCanvas();
    } catch (error) {
        console.error('Error updating game state:', error);
    }
}

// Input queue to store quick key presses between ticks
const inputQueue = [];

function isValidDirection(curr, next) {
    if (!curr || !next) return true;
    if (curr === 'up' && next === 'down') return false;
    if (curr === 'down' && next === 'up') return false;
    if (curr === 'left' && next === 'right') return false;
    if (curr === 'right' && next === 'left') return false;
    return true;
}

function handleKeyPress(event) {
    if (!gameActive || paused) return;
    
    let direction = null;
    
    switch (event.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            direction = 'up';
            event.preventDefault();
            break;
        case 's':
        case 'arrowdown':
            direction = 'down';
            event.preventDefault();
            break;
        case 'a':
        case 'arrowleft':
            direction = 'left';
            event.preventDefault();
            break;
        case 'd':
        case 'arrowright':
            direction = 'right';
            event.preventDefault();
            break;
    }
    
    if (direction) {
        // Randomize controls if setting enabled
        if (settings.random_controls) {
            const dirs = ['up','down','left','right'];
            direction = dirs[Math.floor(Math.random() * dirs.length)];
        }

        const last = inputQueue.length ? inputQueue[inputQueue.length - 1] : currentDirection;
        if (isValidDirection(last, direction)) {
            inputQueue.push(direction);
        }
    }
}

function localSpawnApples(count = 1) {
    const occupied = new Set((gameState.snake || []).map(s => `${s[0]}:${s[1]}`));
    (gameState.apples || []).forEach(a => occupied.add(`${a[0]}:${a[1]}`));

    const empty = [];
    for (let x = 0; x < gameState.width; x++) {
        for (let y = 0; y < gameState.height; y++) {
            const key = `${x}:${y}`;
            if (!occupied.has(key)) empty.push([x, y]);
        }
    }

    let added = 0;
    while (added < count && empty.length) {
        const idx = Math.floor(Math.random() * empty.length);
        const pos = empty.splice(idx, 1)[0];
        gameState.apples = gameState.apples || [];
        gameState.apples.push(pos);
        added += 1;
    }
}

function localMove(direction) {
    if (!gameActive || paused || gameState.game_over) return;

    // Update time locally
    gameState.time = Math.floor((Date.now() - startTime) / 1000);

    const head = gameState.snake[0];
    let head_x = head[0];
    let head_y = head[1];

    if (direction === 'up') head_y -= 1;
    else if (direction === 'down') head_y += 1;
    else if (direction === 'left') head_x -= 1;
    else if (direction === 'right') head_x += 1;

    // Check collision with walls
    if (head_x < 0 || head_x >= gameState.width || head_y < 0 || head_y >= gameState.height) {
        gameState.game_over = true;
        gameActive = false;
        endGame();
        return;
    }

    // Check collision with self
    for (const seg of gameState.snake) {
        if (seg[0] === head_x && seg[1] === head_y) {
            gameState.game_over = true;
            gameActive = false;
            endGame();
            return;
        }
    }

    // Add new head
    gameState.snake.unshift([head_x, head_y]);

    // Check if apple eaten
    let eatenIndex = -1;
    if (gameState.apples) {
        for (let i = 0; i < gameState.apples.length; i++) {
            const apple = gameState.apples[i];
            if (apple[0] === head_x && apple[1] === head_y) {
                eatenIndex = i;
                break;
            }
        }
    }

    if (eatenIndex !== -1) {
        gameState.score += 1;
        gameState.apples.splice(eatenIndex, 1);
        // Spawn apples to maintain count as per settings
        const desired = parseInt(settings.apples_count || 1, 10);
        localSpawnApples(Math.max(0, desired - (gameState.apples ? gameState.apples.length : 0)));
    } else {
        // Remove tail if no apple eaten
        gameState.snake.pop();
    }

    // Update HUD for score and time immediately
    const scoreEl = document.getElementById('score');
    const timeEl = document.getElementById('time');
    if (scoreEl) scoreEl.textContent = gameState.score;
    if (timeEl) timeEl.textContent = gameState.time + 's';

    // Check no room left
    if (gameState.snake.length > gameState.width * gameState.height) {
        gameState.game_over = true;
        gameActive = false;
        endGame();
        return;
    }

    // Update direction
    // (currentDirection is updated in the tick processor)
}

function gameLoop() {
    const now = Date.now();

    // Compute dynamic speed based on score
    const base = SPEED_BASE[settings.speed || 'slow'] || 3;
    const increment = Math.floor((gameState.score || 0) / 5) * 2; // +2 blocks/sec every 5 apples
    const blocksPerSec = Math.min(50, base + increment);
    const intervalMs = 1000 / blocksPerSec;

    if (!paused && now - lastMoveTime >= intervalMs) {
        // Process queued directions quickly so input feels responsive
        if (inputQueue.length) {
            const nextDir = inputQueue.shift();
            if (isValidDirection(currentDirection, nextDir)) currentDirection = nextDir;
        }
        localMove(currentDirection);
        lastMoveTime = now;
    }

    // Throttle drawing to ~30 FPS to reduce CPU on large maps
    const DRAW_INTERVAL = 1000 / 30;
    if (now - lastDrawTime >= DRAW_INTERVAL) {
        draw();
        lastDrawTime = now;
    }

    if (gameActive && !gameState.game_over) {
        requestAnimationFrame(gameLoop);
    }
}

function draw() {
    // Draw alternating grid like Google Snake
    const light = '#c8f5c8';
    const dark = '#a5e6a5';

    for (let x = 0; x < gameState.width; x++) {
        for (let y = 0; y < gameState.height; y++) {
            const isDark = ((x + y) % 2 === 0);
            ctx.fillStyle = isDark ? dark : light;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }

    // Draw border
    ctx.strokeStyle = '#2e7d32';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, gameState.width * cellSize, gameState.height * cellSize);

    // Draw apples
    if (gameState.apples && gameState.apples.length) {
        gameState.apples.forEach(drawApple);
    }

    // Draw snake (unless invisible)
    if (!settings.invisible_snake) {
        drawSnake();
    }
}

function drawSnake() {
    if (!gameState.snake || gameState.snake.length === 0) return;

    let baseColor = getSnakeColors()[0] || '#0066ff';
    const headColor = lightenHex(baseColor, 0.18);
    const tailColor = darkenHex(baseColor, 0.18);

    gameState.snake.forEach((segment, index) => {
        const x = segment[0] * cellSize;
        const y = segment[1] * cellSize;

        if (index === 0) ctx.fillStyle = headColor;
        else if (index === gameState.snake.length - 1) ctx.fillStyle = tailColor;
        else ctx.fillStyle = baseColor;

        const margin = Math.max(1, Math.floor(cellSize * 0.05));
        roundRect(ctx, x + margin, y + margin, cellSize - 2 * margin, cellSize - 2 * margin, Math.max(2, margin));
    });
}

function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
    ctx.fill();
}

function getSnakeColors() {
    const colorMap = {
        'blue': ['#0066ff'],
        'red': ['#ff3333'],
        'green': ['#00cc00'],
        'yellow': ['#ffff00'],
        'purple': ['#9933ff'],
        // 'rainbow' now uses a single red color per request
        'rainbow': ['#ff3333'],
    };
    
    return colorMap[settings.snake_color] || colorMap['blue'];
}

function drawApple(apple) {
    const x = apple[0] * cellSize + cellSize / 2;
    const y = apple[1] * cellSize + cellSize / 2;
    const radius = Math.max(2, cellSize / 2.8);

    // simple pulse animation
    const t = (Date.now() % 1000) / 1000;
    const scale = 0.9 + 0.1 * Math.sin(t * Math.PI * 2);

    ctx.fillStyle = '#ff3333';
    ctx.beginPath();
    ctx.arc(x, y, radius * scale, 0, Math.PI * 2);
    ctx.fill();

    // stem
    ctx.strokeStyle = '#228822';
    ctx.lineWidth = Math.max(1, Math.floor(cellSize * 0.06));
    ctx.beginPath();
    ctx.moveTo(x, y - radius * scale);
    ctx.lineTo(x, y - radius * scale - cellSize / 6);
    ctx.stroke();

    // shine
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(x - radius / 3, y - radius / 3, radius / 3, 0, Math.PI * 2);
    ctx.fill();
}

async function endGame() {
    gameActive = false;

    try {
        const payload = {
            score: gameState.score || 0,
            time: gameState.time || 0,
        };

        const response = await fetch('/api/game/end', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        // Show game over screen (prefer server-confirmed values but fall back to local client values)
        document.getElementById('finalScore').textContent = (data && data.score !== undefined) ? data.score : payload.score;
        document.getElementById('finalTime').textContent = (data && data.time !== undefined) ? data.time : payload.time;
        document.getElementById('gameOverScreen').style.display = 'flex';

        // Update high score locally
        const hsKey = 'ai_snake_highscore';
        const prev = parseInt(localStorage.getItem(hsKey) || '0', 10);
        const finalScore = (data && data.score !== undefined) ? data.score : payload.score;
        if (finalScore > prev) {
            localStorage.setItem(hsKey, finalScore);
        }

        // Refresh leaderboard view and decide whether to ask for name
        const list = await fetchLeaderboard();
        const submitBtn = document.getElementById('submitScoreBtn');
        const nameInput = document.getElementById('playerName');
        const submitContainer = document.querySelector('.submit-score');

        // Determine top-5 eligibility
        let eligible = false;
        if (!list || list.length < 5) eligible = true;
        else {
            const fifth = list[4];
            // If our score is greater than fifth, or equal but faster time, consider it beating the 5th
            if ((gameState.score || 0) > (fifth.score || 0)) eligible = true;
            else if ((gameState.score || 0) === (fifth.score || 0) && (gameState.time || 0) < (fifth.time || 0)) eligible = true;
        }

        if (eligible) {
            if (submitContainer) submitContainer.style.display = 'flex';
            if (submitBtn) submitBtn.disabled = false;
            if (nameInput) nameInput.value = '';
        } else {
            // Hide submit area and show a small note
            if (submitContainer) submitContainer.style.display = 'none';
            // Show a brief message that score didn't make top 5
            let msg = document.getElementById('notTop5Msg');
            if (!msg) {
                msg = document.createElement('div');
                msg.id = 'notTop5Msg';
                msg.style.marginTop = '10px';
                msg.style.color = '#fff';
                msg.style.background = '#f093fb';
                msg.style.padding = '6px 12px';
                msg.style.borderRadius = '8px';
                msg.textContent = 'Not in top 5 — keep trying!';
                const parent = document.querySelector('.game-over-content');
                if (parent) parent.insertBefore(msg, parent.querySelector('.game-over-buttons'));
            }
        }
    } catch (error) {
        console.error('Error ending game:', error);
        // Fallback to local display if network fails
        document.getElementById('finalScore').textContent = gameState.score || 0;
        document.getElementById('finalTime').textContent = gameState.time || 0;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
}

// Leaderboard client functions
async function fetchLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const list = await res.json();
        const menuList = document.getElementById('leaderboardList');
        const gameList = document.getElementById('leaderboardListGame');

        if (menuList) {
            menuList.innerHTML = '';
            list.forEach(entry => {
                const li = document.createElement('li');
                li.textContent = `${entry.name} — ${entry.score} (${entry.time}s)`;
                menuList.appendChild(li);
            });
        }

        if (gameList) {
            gameList.innerHTML = '';
            list.forEach((entry, idx) => {
                const li = document.createElement('li');
                li.textContent = `${idx + 1}. ${entry.name} — ${entry.score} (${entry.time}s)`;
                gameList.appendChild(li);
            });
        }

        return list;
    } catch (err) {
        console.error('Error fetching leaderboard', err);
        return [];
    }
}

async function submitScore() {
    const btn = document.getElementById('submitScoreBtn');
    if (!btn || btn.disabled) return;
    const nameInput = document.getElementById('playerName');
    const name = nameInput ? (nameInput.value.trim() || 'Player') : 'Player';

    const payload = {
        name: name,
        score: gameState.score || 0,
        time: gameState.time || 0,
    };

    try {
        const res = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok) {
            btn.disabled = true;
            await fetchLeaderboard();
        }
    } catch (err) {
        console.error('Error submitting score', err);
    }
} 

function restartGame() {
    // Remove any "not top 5" message and hide submit UI when restarting
    const notMsg = document.getElementById('notTop5Msg');
    if (notMsg) notMsg.remove();
    const submitContainer = document.querySelector('.submit-score');
    if (submitContainer) submitContainer.style.display = 'none';
    const submitBtn = document.getElementById('submitScoreBtn');
    if (submitBtn) submitBtn.disabled = true;

    document.getElementById('gameOverScreen').style.display = 'none';
    initGame();
}

function togglePause() {
    if (!gameActive) return;
    paused = !paused;
    const btn = document.getElementById('pauseBtn');
    if (paused) {
        pausedAt = Date.now();
        btn.textContent = '▶️ RESUME';
    } else {
        // adjust startTime so elapsed time pauses correctly
        if (pausedAt) startTime += (Date.now() - pausedAt);
        pausedAt = null;
        btn.textContent = '⏸️ PAUSE';
        // resume loop
        requestAnimationFrame(gameLoop);
    }
}

function goHome() {
    window.location.href = '/';
}

// Start the game when page loads
initGame();
