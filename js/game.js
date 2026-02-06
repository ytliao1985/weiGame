// js/game.js (最終整合版)

// --- 全域變數 ---
let currentLevelIndex = 0;
let gridSize = 5;
let playerPos = {x:0, y:0};
let commands = [];
let isRunning = false;
let currentMapData = []; 
let maxCommands = 10;
let isGateOpen = false;

// --- 初始化選單 ---
function initMenu() {
    const container = document.getElementById('level-container');
    container.innerHTML = ''; 

    levels.forEach((level, index) => {
        const btn = document.createElement('button');
        btn.className = `level-btn ${level.theme}-btn`; 
        
        // 設定星球圖片連結
        let iconImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/240px-The_Earth_seen_from_Apollo_17.jpg';
        
        if(level.theme === 'theme-mars') {
            iconImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/OSIRIS_Mars_true_color.jpg/240px-OSIRIS_Mars_true_color.jpg';
        }
        if(level.theme === 'theme-jupiter') {
            iconImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Jupiter.jpg/240px-Jupiter.jpg';
        }
        if(level.theme === 'theme-saturn') {
            iconImg = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/240px-Saturn_during_Equinox.jpg';
        }

        // 設定備用 Emoji
        let fallbackEmoji = '🌍';
        if(level.theme === 'theme-mars') fallbackEmoji = '🔴';
        if(level.theme === 'theme-jupiter') fallbackEmoji = '🌪️';
        if(level.theme === 'theme-saturn') fallbackEmoji = '🪐';

        // 建立圖片元素
        const img = document.createElement('img');
        img.src = iconImg;
        img.className = 'level-icon';
        img.alt = level.theme;

        // 防止圖片載入失敗造成無限迴圈
        img.onerror = function() {
            this.onerror = null;
            this.style.display = 'none';
            this.parentElement.insertAdjacentHTML('beforeend', `<span style="font-size:40px;">${fallbackEmoji}</span>`);
        };

        // 組合按鈕
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
    loadLevel(index);
}

// --- 導航功能 ---
function prevLevel() {
    if (currentLevelIndex > 0) {
        loadLevel(currentLevelIndex - 1);
    }
}

function nextLevel() {
    if (currentLevelIndex < levels.length - 1) {
        loadLevel(currentLevelIndex + 1);
    }
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
    hintText.innerHTML = level.hint ? level.hint : "振爲加油！你可以做到的！";
    
    const board = document.getElementById('game-board');
    board.className = ''; 
    board.classList.add(level.theme);

    // ★★★ 設定地圖大小 Class，讓 CSS 處理排版 ★★★
    gridSize = level.map.length; 
    board.classList.remove('grid-5', 'grid-7');
    board.classList.add(`grid-${gridSize}`);
    
    // 清除舊的 inline-style
    board.style.gridTemplateColumns = '';
    board.style.gridTemplateRows = '';

    currentMapData = JSON.parse(JSON.stringify(level.map));
    
    for(let y=0; y<gridSize; y++) {
        for(let x=0; x<gridSize; x++) {
            if(currentMapData[y][x] === 1) playerPos = {x, y};
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
    
    // 這裡會保留放置特效層的空間，但因為 drawBoard 會清空 innerHTML，
    // 所以我們需要動態重新加入特效層，或者在 CSS 控制 overlay 是獨立的
    // (目前的架構每次重繪會清空，所以要在這裡加回 overlay 結構，或者讓 overlay 不在 board 內)
    // ★ 修正：為了讓特效層存在，我們把它加回來，預設隱藏
    board.innerHTML += `<div id="effect-overlay" class="hidden"><img id="effect-img" src="" alt="特效"></div>`;

    for(let y=0; y<gridSize; y++) {
        for(let x=0; x<gridSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            const cellType = currentMapData[y][x];
            
            if (x === playerPos.x && y === playerPos.y) {
                // ★ 注意：這裡使用 run.png
                cell.innerHTML = '<img src="pic/run.png" class="player" alt="哆啦A夢" onerror="this.src=\'https://abs.twimg.com/emoji/v2/72x72/1f916.png\'">'; 
            } else if (cellType === 2) {
                // ★ 注意：這裡使用 dorayaki.png
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
        alert("⛽ 燃料滿了！試試看用「加倍藥水(x2, x3)」來節省燃料？");
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
                    showHurt(nextX, nextY, targetCell === 5 ? "⚡ 哎呀！門還沒開，撞到雷射了！" : "💥 哇啊啊！撞到隕石了！");
                    return;
                }

                if (targetCell === 4) {
                    isGateOpen = true; 
                }
                
                playerPos = {x: nextX, y: nextY};
            }
            
            drawBoard(); 
            
            if (currentMapData[playerPos.y][playerPos.x] === 2) {
                await winGame();
                return;
            }

            await new Promise(r => setTimeout(r, 500)); 
        }
    }

    if (currentMapData[playerPos.y][playerPos.x] !== 2) {
        showHurt(playerPos.x, playerPos.y, "⛽ 燃料用完啦！善用「加倍藥水」可以走比較遠喔！");
    }
}

// --- 特效與結果 ---
async function showFullScreenEffect(imageName) {
    const overlay = document.getElementById('effect-overlay');
    const img = document.getElementById('effect-img');
    
    // 設定圖片
    img.src = `pic/${imageName}`; 
    
    // 顯示圖層
    overlay.classList.remove('hidden');
    
    // 等待 1 秒
    await new Promise(r => setTimeout(r, 1000));
    
    // 隱藏圖層
    overlay.classList.add('hidden');
}

async function showHurt(x, y, msg) {
    // 播放大圖動畫 (預設 hurt.jpg，若是 png 請修改)
    await showFullScreenEffect('hurt.jpg'); 

    alert(msg);
    loadLevel(currentLevelIndex);
}

async function winGame() {
    // 播放大圖動畫 (預設 eat.jpg，若是 png 請修改)
    await showFullScreenEffect('eat.jpg');
    

    alert("😋 成功吃到銅鑼燒！振爲太厲害了！");
    loadLevel(currentLevelIndex + 1);
}

window.onload = function() {
    initMenu(); 
    showMenu(); 
};