// js/game.js (包含導航按鈕功能)

// 全域變數
let currentLevelIndex = 0;
let gridSize = 5;
let playerPos = {x:0, y:0};
let commands = [];
let isRunning = false;
let currentMapData = []; 
let maxCommands = 10;
let isGateOpen = false;

// 初始化選單 (網路圖片版)
function initMenu() {
    const container = document.getElementById('level-container');
    container.innerHTML = ''; 

    levels.forEach((level, index) => {
        const btn = document.createElement('button');
        btn.className = `level-btn ${level.theme}-btn`; 
        
        // --- 設定星球圖片連結 ---
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

        // --- 設定備用 Emoji ---
        let fallbackEmoji = '🌍';
        if(level.theme === 'theme-mars') fallbackEmoji = '🔴';
        if(level.theme === 'theme-jupiter') fallbackEmoji = '🌪️';
        if(level.theme === 'theme-saturn') fallbackEmoji = '🪐';

        // 建立圖片元素
        const img = document.createElement('img');
        img.src = iconImg;
        img.className = 'level-icon';
        img.alt = level.theme;

        // ★★★ 關鍵修正：防止無限迴圈 ★★★
        img.onerror = function() {
            this.onerror = null; // 1. 確保只執行一次，不會重複觸發
            this.style.display = 'none'; // 2. 隱藏破圖
            // 3. 用 insertAdjacentHTML 插入 Emoji，絕對不會觸發重繪！
            this.parentElement.insertAdjacentHTML('beforeend', `<span style="font-size:40px;">${fallbackEmoji}</span>`);
        };

        // 組合按鈕文字與圖片
        btn.innerHTML = `${level.name} `; // 先放文字
        btn.appendChild(img);              // 再放圖片 (圖片裡面掛載了防護罩)
        
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

// ★★★ 新增：上一關功能 ★★★
function prevLevel() {
    if (currentLevelIndex > 0) {
        loadLevel(currentLevelIndex - 1);
    }
}

// ★★★ 新增：下一關功能 ★★★
function nextLevel() {
    if (currentLevelIndex < levels.length - 1) {
        loadLevel(currentLevelIndex + 1);
    }
}

// ★★★ 新增：更新導航按鈕狀態 (防呆機制) ★★★
function updateNavButtons() {
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');

    // 如果是第一關 (index 0)，禁用上一關按鈕
    btnPrev.disabled = (currentLevelIndex === 0);
    
    // 如果是最後一關，禁用下一關按鈕
    btnNext.disabled = (currentLevelIndex === levels.length - 1);
}

// 讀取關卡
// js/game.js 的 loadLevel 函式

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

    // ★★★ 核心修改：不再設定 style.width/height，而是設定變數 ★★★
    gridSize = level.map.length; 
    
    // 告訴 CSS 現在是幾乘幾 (5 或 7)
    // CSS 會根據這個變數去自動計算格子大小
    board.style.setProperty('--grid-size', gridSize);
    
    // 清除舊的 inline-style (避免殘留干擾)
    board.style.gridTemplateColumns = '';
    board.style.gridTemplateRows = '';
    // -------------------------------------------------------

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

// js/game.js 的 drawBoard 函式

function drawBoard() {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    
    // ★★★ 注意：這裡原本計算 sizePx 的程式碼已經刪掉了！ ★★★
    // 一切交給 CSS 自動處理，這樣手機才不會跑版

    for(let y=0; y<gridSize; y++) {
        for(let x=0; x<gridSize; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            
            // ★★★ 這裡原本有的 cell.style.width = ... 也刪掉了！ ★★★
            // 不要手動設定大小，讓它跟隨 CSS Grid 自動縮放

            const cellType = currentMapData[y][x];
            
            if (x === playerPos.x && y === playerPos.y) {
                cell.innerHTML = '<img src="pic/run.jpg" class="player" alt="哆啦A夢" onerror="this.src=\'https://abs.twimg.com/emoji/v2/72x72/1f916.png\'">'; 
            } else if (cellType === 2) {
                cell.innerHTML = '<img src="pic/dorayaki.jpg" class="goal" alt="銅鑼燒" onerror="this.src=\'https://abs.twimg.com/emoji/v2/72x72/1f369.png\'">'; 
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

async function showHurt(x, y, msg) {
    const board = document.getElementById('game-board');
    const index = y * gridSize + x;
    
    if(x !== playerPos.x || y !== playerPos.y) {
         board.children[playerPos.y * gridSize + playerPos.x].innerHTML = '';
    }

    board.children[index].innerHTML = '<img src="pic/hurt.jpg" class="hurt" alt="受傷">';
    await new Promise(r => setTimeout(r, 500));
    alert(msg);
    loadLevel(currentLevelIndex);
}

async function winGame() {
    const board = document.getElementById('game-board');
    const index = playerPos.y * gridSize + playerPos.x;
    board.children[index].innerHTML = '<img src="pic/eat.jpg" class="player" alt="開吃">';
    await new Promise(r => setTimeout(r, 500));
    alert("😋 成功吃到銅鑼燒！振爲太厲害了！");
    loadLevel(currentLevelIndex + 1);
}

window.onload = function() {
    initMenu(); 
    showMenu(); 

};
