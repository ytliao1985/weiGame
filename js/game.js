// js/game.js (無音樂乾淨版)

// --- 全域變數 ---
let currentLevelIndex = 0;
let gridSize = 5;
let playerPos = {x:0, y:0};
let commands = [];
let isRunning = false;
let currentMapData = []; 
let maxCommands = 10;
let isGateOpen = false;
let remainingDorayakis = 0;

// --- 初始化選單 ---
function initMenu() {
    const container = document.getElementById('level-container');
    container.innerHTML = ''; 

    levels.forEach((level, index) => {
        const btn = document.createElement('button');
        btn.className = `level-btn ${level.theme}-btn`; 
        
        let iconImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/240px-The_Earth_seen_from_Apollo_17.jpg';
        if(level.theme === 'theme-mars') iconImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/240px-OSIRIS_Mars_true_color.jpg';
        if(level.theme === 'theme-jupiter') iconImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/240px-Jupiter.jpg';
        if(level.theme === 'theme-saturn') iconImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/240px-Saturn_during_Equinox.jpg';

        let fallbackEmoji = '🌍';
        if(level.theme === 'theme-mars') fallbackEmoji = '🔴';
        if(level.theme === 'theme-jupiter') fallbackEmoji = '🌪️';
        if(level.theme === 'theme-saturn') fallbackEmoji = '🪐';

        const img = document.createElement('img');
        img.src = iconImg;
        img.className = 'level-icon';
        img.alt = level.theme;
        img.onerror = function() {
            this.onerror = null;
            this.style.display = 'none';
            this.parentElement.insertAdjacentHTML('beforeend', `<span style="font-size:40px;">${fallbackEmoji}</span>`);
        };

        btn.innerHTML = `${level.name} `; 
        btn.appendChild(img);
        btn.onclick = () => startGame(index);
        container.appendChild(btn);
    });
}

function showMenu() {
    document.getElementById('menu-screen').classList.remove('hidden');
    document.getElementById('game-screen').classList.add('hidden');
    isRunning = false; 
}

function startGame(index) {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    // 音樂移除：直接載入關卡
    loadLevel(index);
}

// --- 導航功能 ---
function prevLevel() {
    if (currentLevelIndex > 0) loadLevel(currentLevelIndex - 1);
}

function nextLevel() {
    if (currentLevelIndex < levels.length - 1) loadLevel(currentLevelIndex + 1);
}

function updateNavButtons() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    btnPrev.disabled = (currentLevelIndex === 0);
    btnNext.disabled = (currentLevelIndex === levels.length - 1);
}

// --- 讀取關卡核心 ---
function loadLevel(index) {
    if (index >= levels.length) {
        alert("🎉 全破！振爲你是程式設計大師！\n不管是迴圈還是邏輯判斷都難不倒你！🏆");
        showMenu();
        return;
    }
    
    currentLevelIndex = index;
    const level = levels[index];
    maxCommands = level.maxSteps; 
    isGateOpen = false;

    updateNavButtons();

    const info = document.getElementById('planet-info');
    info.innerText = level.label;

    const hintText = document.getElementById('level-hint-text');
    hintText.innerHTML = level.hint ? level.hint : "振爲加油！";
    
    const board = document.getElementById('game-board');
    board.className = ''; 
    board.classList.add(level.theme);
    
    // 設定地圖 Grid
    gridSize = level.map.length; 
    board.classList.remove('grid-5', 'grid-7');
    board.classList.add(`grid-${gridSize}`);
    board.style.gridTemplateColumns = '';
    board.style.gridTemplateRows = '';

    currentMapData = JSON.parse(JSON.stringify(level.map));
    
    // 計算銅鑼燒數量
    remainingDorayakis = 0;
    for(let y=0; y<gridSize; y++) {
        for(let x=0; x<gridSize; x++) {
            if(currentMapData[y][x] === 1) playerPos = {x, y};
            if(currentMapData[y][x] === 2) remainingDorayakis++; 
        }
    }
    
    commands = [];
    isRunning = false;
    updateCommandDisplay();
    drawBoard();
}

// --- 繪製地圖 ---
function drawBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    // 插入特效層
    board.innerHTML += `<div id="effect-overlay" class="hidden"><img id="effect-img" src="" alt="特效"></div>`;

    for(let y=0; y<gridSize; y++) {
        for(let x=0; x<gridSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            const cellType = currentMapData[y][x];
            
            if (x === playerPos.x && y === playerPos.y) {
                cell.innerHTML = '<img src="pic/run.png" class="player" alt="哆啦A夢" onerror="this.src=\'https://abs.twimg.com/emoji/v2/72x72/1f916.png\'">'; 
            } else if (cellType === 2) {
                cell.innerHTML = '<img src="pic/dorayaki.png" class="goal" alt="銅鑼燒" onerror="this.src=\'https://abs.twimg.com/emoji/v2/72x72/1f369.png\'">'; 
            } else if (cellType === 3) {
                cell.innerHTML = '<span class="rock">☄️</span>'; 
            } else if (cellType === 4) {
                cell.innerHTML = isGateOpen ? '<span class="switch-on">🟢</span>' : '<span class="switch-off">🔴</span>';
            } else if (cellType === 5) {
                if(isGateOpen) {
                    cell.innerHTML = '<div class="gate-open"></div>'; 
                } else {
                    cell.innerHTML = '<div class="gate-closed"></div>'; 
                }
            }
            board.appendChild(cell);
        }
    }
}

// --- 指令操作 ---
function addCommand(cmd) {
    if(isRunning) return;
    if(commands.length >= maxCommands) {
        alert("⛽ 燃料滿了！");
        return;
    }
    commands.push(cmd);
    updateCommandDisplay();
}

function addLoop(times) {
    if(isRunning) return;
    if(commands.length === 0) return;
    let lastCmd = commands[commands.length - 1];
    if(lastCmd.includes('x')) {
        alert("❌ 已經加倍過了喔！");
        return;
    }
    commands[commands.length - 1] = `${lastCmd} x${times}`;
    updateCommandDisplay();
}

function undoCommand() {
    if(isRunning) return;
    if(commands.length === 0) return;
    commands.pop();
    updateCommandDisplay();
}

function clearCommands() {
    if(isRunning) return;
    commands = [];
    updateCommandDisplay();
}

function updateCommandDisplay() {
    const list = document.getElementById('command-list');
    list.innerHTML = '';
    commands.forEach(cmd => {
        if(cmd.includes('x')) {
            list.innerHTML += `<span class="cmd-block cmd-loop">${cmd}</span>`;
        } else {
            list.innerHTML += `<span class="cmd-block">${cmd}</span>`;
        }
    });

    const fuelDisplay = document.getElementById('fuel-display');
    fuelDisplay.innerText = `⛽ 燃料: ${commands.length} / ${maxCommands}`;
    if(commands.length >= maxCommands - 1) {
        fuelDisplay.classList.add('fuel-warning');
    } else {
        fuelDisplay.classList.remove('fuel-warning');
    }
}

// --- 執行程式碼 (核心邏輯) ---
async function runCode() {
    if(commands.length === 0 || isRunning) return;
    isRunning = true;

    for(let i=0; i<commands.length; i++) {
        let cmdString = commands[i];
        let parts = cmdString.split(' x'); 
        let direction = parts[0];          
        let loops = parts.length > 1 ? parseInt(parts[1]) : 1; 

        for(let k=0; k<loops; k++) {
            let nextX = playerPos.x;
            let nextY = playerPos.y;

            if (direction === '⬆️') nextY--;
            if (direction === '⬇️') nextY++;
            if (direction === '⬅️') nextX--;
            if (direction === '➡️') nextX++;

            if (nextX >= 0 && nextX < gridSize && nextY >= 0 && nextY < gridSize) {
                let targetCell = currentMapData[nextY][nextX];

                if (targetCell === 3 || (targetCell === 5 && !isGateOpen)) {
                    showHurt(nextX, nextY, targetCell === 5 ? "⚡ 撞到雷射了！" : "💥 撞到隕石了！");
                    return;
                }
                if (targetCell === 4) isGateOpen = true; 
                playerPos = {x: nextX, y: nextY};
            }
            
            drawBoard(); 
            
            if (currentMapData[playerPos.y][playerPos.x] === 2) {
                currentMapData[playerPos.y][playerPos.x] = 0; 
                remainingDorayakis--; 
                drawBoard(); 

                if (remainingDorayakis === 0) {
                    await winGame();
                    return;
                }
            }

            await new Promise(r => setTimeout(r, 500)); 
        }
    }

    if (remainingDorayakis > 0) {
        showHurt(playerPos.x, playerPos.y, "⛽ 燃料用完啦！銅鑼燒還沒吃完喔！");
    }
}

// --- 特效與結果 ---
async function showFullScreenEffect(imageName) {
    const overlay = document.getElementById('effect-overlay');
    const img = document.getElementById('effect-img');
    
    if (imageName.startsWith('http')) {
        img.src = imageName;
    } else {
        img.src = `pic/${imageName}`;
    }
    
    overlay.classList.remove('hidden');
    await new Promise(r => setTimeout(r, 1500));
    overlay.classList.add('hidden');
}

async function showHurt(x, y, msg) {
    await showFullScreenEffect('hurt.jpg'); 
    alert(msg);
    loadLevel(currentLevelIndex);
}

async function winGame() {
    await showFullScreenEffect('eat.jpg');
    alert("😋 成功吃到所有銅鑼燒！振爲太厲害了！");
    loadLevel(currentLevelIndex + 1);
}

window.onload = function() {
    initMenu(); 
    showMenu(); 
};