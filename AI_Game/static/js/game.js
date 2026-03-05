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

// AI autoplayer state
let aiEnabled = false;
let hamiltonian = null; // array of [x,y] visiting each cell in order when available
let hIndexMap = null;  // map "x:y" -> index in hamiltonian for quick lookup
let hamiltonianIsCycle = false; // true if the pattern forms a closed Hamiltonian cycle
let hamiltonianExcludedCell = null; // optional [x,y] cell excluded to allow a cycle on odd×odd maps
let lastAILogTime = 0; // throttle ai debug posts (ms)



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
// Global window error hooks to report JS exceptions back to server
window.addEventListener('error', (e) => {
    try { fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'window_error', message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno})}).catch(()=>{}); } catch(e2) {}
});
window.addEventListener('unhandledrejection', (ev) => {
    try { fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'unhandled_rejection', reason: String(ev.reason)})}).catch(()=>{}); } catch(e2) {}
});

async function initGame() {
    // Debug: notify server we started initialization
    fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'init_start'})}).catch(()=>{});

    try {
        // Load settings
        await loadSettings();
        // Debug: settings loaded
        fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'loaded_settings', settings})}).catch(()=>{});
    } catch (err) {
        fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'load_settings_error', error:String(err)})}).catch(()=>{});
        console.error('Error in loadSettings', err);
    }
    
    // Apply background
    document.body.style.background = settings.background || 'white';

    // Start the game
    fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'before_start'})}).catch(()=>{});
    await startGame();
    fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'after_start', active: gameActive, snake_len: (gameState.snake || []).length})}).catch(()=>{});
    
    // Setup event listeners
    document.addEventListener('keydown', handleKeyPress);
    
    // Setup canvas
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Start game loop
    lastMoveTime = 0;
    paused = false;

    // Debug: log post-init canvas state
    try { fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'init_after', canvas_w: canvas.width, canvas_h: canvas.height, cellSize, gw:gameState.width, gh:gameState.height, gameActive})}).catch(()=>{}); } catch(e) {}

    requestAnimationFrame(gameLoop);
}

let lastResizeLog = 0;
const MIN_CELL_SIZE = 6; // ensure visible squares on reasonable screens
function resizeCanvas() {
    const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 300);
    // Calculate available per-cell size
    const available = Math.max(1, Math.floor(maxSize / gameState.width));
    // Make squares slightly larger while ensuring the grid fits
    let tentative = Math.floor(maxSize / gameState.width) + 1; // try +1 pixel per cell
    if (tentative * gameState.width > maxSize) tentative = Math.floor(maxSize / gameState.width);

    // Only enforce a minimum cell size if the available size can support it
    if (available >= MIN_CELL_SIZE) {
        cellSize = Math.max(MIN_CELL_SIZE, tentative);
    } else {
        // Not enough room for MIN_CELL_SIZE — fallback to best available (prevents overflow)
        cellSize = Math.max(1, tentative);
    }

    canvas.width = cellSize * gameState.width;
    canvas.height = cellSize * gameState.height;
    // Also set CSS size so canvas is visually the expected dimensions (helps high-DPI/layout)
    canvas.style.width = Math.min(canvas.width, maxSize) + 'px';
    canvas.style.height = Math.min(canvas.height, maxSize) + 'px';

    // Log a resize summary (throttled)
    try {
        const now = Date.now();
        if (now - lastResizeLog > 500) {
            lastResizeLog = now;
            fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'resize', cw:canvas.width, ch:canvas.height, cellSize, gw:gameState.width, gh:gameState.height, innerW: window.innerWidth, innerH: window.innerHeight})}).catch(()=>{});
        }
    } catch(e) {}

    // Recompute Hamiltonian when canvas or map size changes
    if (aiEnabled) {
        buildHamiltonianIfPossible();
    }
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

                // Load leaderboard so it's ready during the session
            await fetchLeaderboard();
            // Build map pattern if AI is enabled; do NOT force-align on start (avoid teleport)
            if (aiEnabled) {
                buildHamiltonianIfPossible();
            }
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
    if (!gameActive || paused || aiEnabled) return; // ignore user input while AI is active
    
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
    // If a cell is intentionally excluded by the Hamiltonian generator (odd×odd near-cycle), avoid spawning apples there
    const excludedKey = hamiltonianExcludedCell ? `${hamiltonianExcludedCell[0]}:${hamiltonianExcludedCell[1]}` : null;
    for (let x = 0; x < gameState.width; x++) {
        for (let y = 0; y < gameState.height; y++) {
            const key = `${x}:${y}`;
            if (excludedKey && key === excludedKey) continue;
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
    if (!gameActive || paused || gameState.game_over) {
        try { fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'localMove_skipped', gameActive, paused, game_over: gameState.game_over, direction})}).catch(()=>{}); } catch(e) {}
        return;
    }

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
        // If AI is enabled, compute the next direction and ignore user input
        if (aiEnabled) {
            const aiDir = aiNextDirection();
            if (aiDir && isValidDirection(currentDirection, aiDir)) currentDirection = aiDir;

            // Throttled debug POST to server so we can see AI decisions in logs
            try {
                const tnow = Date.now();
                if (tnow - lastAILogTime > 500) {
                    lastAILogTime = tnow;
                    const head = (gameState.snake && gameState.snake[0]) || null;
                    fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'ai_tick', aiDir, currentDirection, head, gameActive, paused, game_over: gameState.game_over})}).catch(()=>{});
                }
            } catch (e) {}
        } else {
            // Process queued directions quickly so input feels responsive
            if (inputQueue.length) {
                const nextDir = inputQueue.shift();
                if (isValidDirection(currentDirection, nextDir)) currentDirection = nextDir;
            }
        }

        localMove(currentDirection);
        // If AI is enabled, report that we performed a move (helpful to detect skipped moves)
        if (aiEnabled) {
            try { const head = (gameState.snake && gameState.snake[0]) || null; fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'ai_moved', currentDirection, head})}).catch(()=>{}); } catch(e) {}
        }
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

    const colors = getSnakeColors();

    gameState.snake.forEach((segment, index) => {
        const x = segment[0] * cellSize;
        const y = segment[1] * cellSize;

        // choose a base color for this segment (supports rainbow cycling)
        const baseColor = colors.length > 1 ? colors[index % colors.length] : colors[0] || '#0066ff';
        const headColor = lightenHex(baseColor, 0.18);
        const tailColor = darkenHex(baseColor, 0.18);

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
        // Rainbow is an array of colors used cyclically across segments
        'rainbow': ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0066ff', '#9933ff'],
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

// AI helpers

function areAdjacent(a, b) {
    if (!a || !b) return false;
    const dx = Math.abs(a[0] - b[0]);
    const dy = Math.abs(a[1] - b[1]);
    return (dx + dy) === 1;
}

function buildHamiltonianIfPossible() {
    const w = gameState.width;
    const h = gameState.height;
    // Hamiltonian cycle possible when at least one dimension is even
    if (w % 2 !== 0 && h % 2 !== 0) {
        hamiltonian = null;
        hIndexMap = null;
        return null;
    }

    const path = [];
    if (w % 2 === 0) {
        // column-wise serpentine
        for (let x = 0; x < w; x++) {
            if (x % 2 === 0) {
                for (let y = 0; y < h; y++) path.push([x, y]);
            } else {
                for (let y = h - 1; y >= 0; y--) path.push([x, y]);
            }
        }
    } else {
        // row-wise serpentine (height must be even)
        for (let y = 0; y < h; y++) {
            if (y % 2 === 0) {
                for (let x = 0; x < w; x++) path.push([x, y]);
            } else {
                for (let x = w - 1; x >= 0; x--) path.push([x, y]);
            }
        }
    }

    // Try to convert the Hamiltonian path into a cycle by a 2-opt swap
    const n = path.length;
    let madeCycle = false;
    function tryClose() {
        if (areAdjacent(path[n - 1], path[0])) return true;
        for (let i = 0; i < n - 2; i++) {
            for (let j = i + 1; j < n - 1; j++) {
                // check if swapping path[i+1..j] will connect endpoints
                if (areAdjacent(path[i], path[j + 1]) && areAdjacent(path[j], path[i + 1])) {
                    // reverse segment i+1..j
                    let a = i + 1, b = j;
                    while (a < b) {
                        const tmp = path[a];
                        path[a] = path[b];
                        path[b] = tmp;
                        a++; b--;
                    }
                    if (areAdjacent(path[n - 1], path[0])) return true;
                }
            }
        }
        return false;
    }

    madeCycle = tryClose();

    if (!madeCycle) {
        // if still not a cycle, try an alternate serpentine orientation (swap roles)
        // flip traversal: start row-wise then column-wise pattern
        // simple attempt: reverse the entire path and try close
        path.reverse();
        madeCycle = tryClose();
    }

    // If we still can't make a cycle and the grid is odd×odd, try a near-cycle by excluding one cell:
    // Remove the last cell of the serpentine path and attempt to close on the remaining (n-1) cells.
    hamiltonianExcludedCell = null;
    if (!madeCycle && (w % 2 !== 0 && h % 2 !== 0)) {
        // conservative choice: exclude the last position in the path so the remaining path is contiguous
        const excluded = path.pop();
        hamiltonianExcludedCell = excluded; // store excluded cell
        // rebuild n and attempt closure again
        const m = path.length;
        function tryCloseOnM() {
            if (areAdjacent(path[m - 1], path[0])) return true;
            for (let i = 0; i < m - 2; i++) {
                for (let j = i + 1; j < m - 1; j++) {
                    if (areAdjacent(path[i], path[j + 1]) && areAdjacent(path[j], path[i + 1])) {
                        let a = i + 1, b = j;
                        while (a < b) {
                            const tmp = path[a];
                            path[a] = path[b];
                            path[b] = tmp;
                            a++; b--;
                        }
                        if (areAdjacent(path[m - 1], path[0])) return true;
                    }
                }
            }
            return false;
        }
        madeCycle = tryCloseOnM();
        if (!madeCycle) {
            // try reverse then close
            path.reverse();
            madeCycle = tryCloseOnM();
        }
    }

    // Regardless of whether it's a cycle, keep the path as canonical pattern to follow
    hamiltonianIsCycle = madeCycle;
    hamiltonian = path;
    hIndexMap = {};
    for (let i = 0; i < path.length; i++) {
        const key = `${path[i][0]}:${path[i][1]}`;
        hIndexMap[key] = i;
    }
    return path;
}

function alignSnakeToHamiltonian() {
    // show a brief centered toast message
    function showToast(msg, duration=2000) {
        try {
            let t = document.getElementById('toast');
            if (!t) return;
            t.textContent = msg;
            t.style.display = 'block';
            t.classList.add('show');
            setTimeout(() => { t.classList.remove('show'); setTimeout(()=>{ t.style.display='none'; },150); }, duration);
        } catch (e) {}
    }
    // Align the snake to a contiguous segment of the pattern, preferring a start near the current head
    if (!hamiltonian || !hIndexMap || !gameState.snake) return false;
    const n = hamiltonian.length;
    const currentHead = gameState.snake[0] || [0,0];
    const L = Math.max(2, (gameState.snake && gameState.snake.length) || 2);
    const appleSet = new Set((gameState.apples || []).map(a => `${a[0]}:${a[1]}`));

    let bestStart = -1;
    let bestDist = Infinity;

    for (let start = 0; start < n; start++) {
        let ok = true;
        const seg = [];
        for (let k = 0; k < L; k++) {
            const p = hamiltonian[(start + k) % n];
            const key = `${p[0]}:${p[1]}`;
            // avoid starting on an apple
            if (appleSet.has(key)) { ok = false; break; }
            seg.push([p[0], p[1]]);
        }
        if (!ok) continue;
        // measure manhattan distance between current head and potential head position
        const dx = Math.abs(seg[0][0] - currentHead[0]);
        const dy = Math.abs(seg[0][1] - currentHead[1]);
        const dist = dx + dy;
        if (dist < bestDist) {
            bestDist = dist;
            bestStart = start;
        }
    }

    if (bestStart === -1) return false;

    // if the chosen start is far away, skip aligning to avoid teleporting the snake
    const threshold = Math.max(6, Math.floor(Math.max(gameState.width, gameState.height) / 6));
    if (bestDist > threshold) {
        try {
            fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'align_skipped_far', before: currentHead, best: hamiltonian[bestStart], dist: bestDist, threshold})}).catch(()=>{});
        } catch (e) {}
        // brief user-visible message
        try { showToast('Align skipped: too far'); } catch(e) {}
        return false;
    }

    // place chosen segment
    const newSeg = [];
    for (let k = 0; k < L; k++) {
        newSeg.push(hamiltonian[(bestStart + k) % n]);
    }

    // safety: ensure new segment does not overlap existing snake positions (would cause instant death)
    const snakeSet = new Set((gameState.snake || []).map(s => `${s[0]}:${s[1]}`));
    let overlap = false;
    for (const p of newSeg) {
        if (snakeSet.has(`${p[0]}:${p[1]}`)) { overlap = true; break; }
    }
    if (overlap) {
        try { fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'align_skipped_overlap', before: currentHead, best: hamiltonian[bestStart]})}).catch(()=>{}); } catch(e) {}
        try { showToast('Align skipped: overlap with snake'); } catch(e) {}
        return false;
    }

    // Debug: log before/after to server for visibility
    try {
        fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'align_snake', before: currentHead, after: newSeg[0], len: L, dist: bestDist})}).catch(()=>{});
    } catch (e) {}

    // show confirmation
    try { showToast('Aligned to pattern'); } catch(e) {}

    gameState.snake = newSeg.map(s => [s[0], s[1]]);
    if (gameState.snake.length >= 2) {
        const dir = directionFrom(gameState.snake[0], gameState.snake[1]);
        if (dir) currentDirection = dir;
    }
    return true;
}

function directionFrom(a, b) {
    if (!a || !b) return null;
    if (b[0] === a[0] + 1 && b[1] === a[1]) return 'right';
    if (b[0] === a[0] - 1 && b[1] === a[1]) return 'left';
    if (b[1] === a[1] + 1 && b[0] === a[0]) return 'down';
    if (b[1] === a[1] - 1 && b[0] === a[0]) return 'up';
    return null;
}

// BFS pathfinder (returns array of [x,y] from start to goal inclusive) or null
function bfsPath(start, goal, allowTail=true) {
    const w = gameState.width;
    const h = gameState.height;
    const snake = gameState.snake || [];
    const occupied = new Set(snake.map(s => `${s[0]}:${s[1]}`));
    // Allow stepping into tail if allowTail (tail moves)
    const tailKey = snake.length ? `${snake[snake.length-1][0]}:${snake[snake.length-1][1]}` : null;

    const q = [];
    const visited = new Set();
    q.push({pos:start, prev: null});
    visited.add(`${start[0]}:${start[1]}`);
    const parent = {};

    while (q.length) {
        const node = q.shift();
        const [x,y] = node.pos;
        const key = `${x}:${y}`;
        if (x === goal[0] && y === goal[1]) {
            // reconstruct path
            const path = [];
            let cur = key;
            while (cur) {
                const [cx, cy] = cur.split(':').map(Number);
                path.push([cx, cy]);
                cur = parent[cur];
            }
            return path.reverse();
        }

        const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const d of dirs) {
            const nx = x + d[0];
            const ny = y + d[1];
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
            const nkey = `${nx}:${ny}`;
            if (visited.has(nkey)) continue;
            // if occupied and not tail (or tail not allowed), skip
            if (occupied.has(nkey) && !(allowTail && nkey === tailKey)) continue;
            visited.add(nkey);
            parent[nkey] = key;
            q.push({pos:[nx,ny], prev: key});
        }
    }
    return null;
}

// Simulate following a path and return whether after the path we can rejoin the Hamiltonian safely
function simulatePathSafe(path, applePos) {
    // copy snake
    const simSnake = (gameState.snake || []).map(s => [s[0], s[1]]);
    const simApples = (gameState.apples || []).map(a => [a[0], a[1]]);

    const willEat = (applePos && applePos[0] === path[path.length-1][0] && applePos[1] === path[path.length-1][1]);

    for (let i = 1; i < path.length; i++) {
        const [nx, ny] = path[i];
        // move head
        simSnake.unshift([nx, ny]);
        // if this step eats an apple at final, keep tail (grow)
        if (i === path.length-1 && willEat) {
            // remove apple from simApples
            for (let k = 0; k < simApples.length; k++) {
                if (simApples[k][0] === nx && simApples[k][1] === ny) { simApples.splice(k,1); break; }
            }
            // do not pop tail (growth)
        } else {
            // normal move: pop tail
            simSnake.pop();
        }
    }

    // After simulation, check if we can rejoin Hamiltonian: find any hamiltonian cell reachable from head without crossing simSnake
    const simOccupied = new Set(simSnake.map(s => `${s[0]}:${s[1]}`));
    const head = simSnake[0];

    if (hamiltonian && hIndexMap) {
        // BFS from head to any hamiltonian cell
        const w = gameState.width;
        const h = gameState.height;
        const visited = new Set();
        const q = [[head[0], head[1]]];
        visited.add(`${head[0]}:${head[1]}`);
        while (q.length) {
            const [x,y] = q.shift();
            const key = `${x}:${y}`;
            if (hIndexMap[key] !== undefined && !simOccupied.has(key)) {
                // found a rejoin point
                return true;
            }
            const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
            for (const d of dirs) {
                const nx = x + d[0];
                const ny = y + d[1];
                const nkey = `${nx}:${ny}`;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                if (visited.has(nkey)) continue;
                if (simOccupied.has(nkey)) continue;
                visited.add(nkey);
                q.push([nx,ny]);
            }
        }
        return false;
    } else {
        // Without a Hamiltonian, check reachable free space size — must be >= simSnake.length to have room
        const w = gameState.width;
        const h = gameState.height;
        const visited = new Set();
        const q = [[head[0], head[1]]];
        visited.add(`${head[0]}:${head[1]}`);
        let freeCount = 0;
        while (q.length) {
            const [x,y] = q.shift();
            const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
            for (const d of dirs) {
                const nx = x + d[0];
                const ny = y + d[1];
                const nkey = `${nx}:${ny}`;
                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                if (visited.has(nkey)) continue;
                if (simOccupied.has(nkey)) continue;
                visited.add(nkey);
                freeCount++;
                q.push([nx,ny]);
            }
        }
        return freeCount >= simSnake.length;
    }
}

function aiNextDirection() {
    if (!gameState.snake || gameState.snake.length === 0) return currentDirection;
    const head = gameState.snake[0];

    // AI: prefer safe apple shortcuts if available
    if (gameState.apples && gameState.apples.length && gameState.snake.length < gameState.width * gameState.height) {
        let bestPath = null;
        let bestLen = Infinity;
        for (const apple of gameState.apples) {
            const path = bfsPath(head, apple, true);
            if (!path) continue;
            // Simulate and check safety
            if (simulatePathSafe(path, apple)) {
                if (path.length < bestLen) { bestLen = path.length; bestPath = path; }
            }
        }
        if (bestPath && bestPath.length >= 2) {
            const next = bestPath[1];
            const dir = directionFrom(head, next);
            return dir || currentDirection;
        }
    }

    // If we have a Hamiltonian pattern, follow it
    if (hamiltonian && hIndexMap) {
        const key = `${head[0]}:${head[1]}`;
        const idx = hIndexMap[key];
        if (idx === undefined) return currentDirection;
        const next = hamiltonian[(idx + 1) % hamiltonian.length];
        const dir = directionFrom(head, next);
        return dir || currentDirection;
    }

    // No pattern available: fall back to any safe non-backwards move
    const w = gameState.width;
    const h = gameState.height;
    const snakeSet = new Set((gameState.snake || []).map(s => `${s[0]}:${s[1]}`));
    const possible = ['up','down','left','right'];
    for (const d of possible) {
        if (!isValidDirection(currentDirection, d)) continue;
        let nx = head[0], ny = head[1];
        if (d === 'up') ny--;
        if (d === 'down') ny++;
        if (d === 'left') nx--;
        if (d === 'right') nx++;
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        if (snakeSet.has(`${nx}:${ny}`)) continue;
        return d;
    }

    return currentDirection;
}

// End AI helpers

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

// AI toggle handler
async function toggleAI() {
    aiEnabled = !aiEnabled;
    const btn = document.getElementById('aiBtn');
    if (aiEnabled) {
        // If no game active, start one so AI can take control immediately
        if (!gameActive) {
            try {
                await startGame();
            } catch (e) { console.error('Error auto-starting game for AI', e); }
        }

        // Ensure not paused
        paused = false;

        // Build map pattern, try to align, and force an immediate tick so AI starts moving
        buildHamiltonianIfPossible();
        const ok = alignSnakeToHamiltonian();
        // Log whether align succeeded along with some diagnostic info
        try { fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'toggle_align_result', ok, hlen: (hamiltonian ? hamiltonian.length : 0), head: (gameState.snake && gameState.snake[0])})}).catch(()=>{}); } catch(e) {}
        // Force an immediate move interval so AI starts promptly
        lastMoveTime = 0;

        // Compute and apply an initial AI direction immediately if safe
        try {
            const aiDir = aiNextDirection();
            try { fetch('/api/debug/log', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({msg:'toggle_ai_initial', aiDir})}).catch(()=>{}); } catch(e) {}
            if (aiDir && isValidDirection(currentDirection, aiDir) && gameActive && !paused && !gameState.game_over) {
                currentDirection = aiDir;
                // apply one immediate local move to start motion without waiting for next tick
                try { localMove(currentDirection); } catch (e) {}
                draw();
            }
        } catch(e) {}

        if (hamiltonianIsCycle) btn.textContent = '🤖 AUTO: ON (Guaranteed)';
        else btn.textContent = '🤖 AUTO: ON (Pattern)';
    } else {
        if (btn) btn.textContent = '🤖 AUTO: OFF';
    }
}

function restartGame() {
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
