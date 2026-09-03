// pencil.js - Глобальний інструмент малювання для всіх ігор
(function() {
    // 1. ЗАХИСТ ВІД ДУБЛЮВАННЯ ТА ВИМКНЕННЯ НА ВЧИТЕЛЬСЬКІЙ ПАНЕЛІ
    if (document.getElementById('global-draw-container') || window.location.pathname.includes('teacher_panel.html')) return;

    // 2. АВТОМАТИЧНА ЗАЧИСТКА СТАРИХ ЛОКАЛЬНИХ ІНСТРУМЕНТІВ (ЩОБ НЕ БЛОКУВАЛИ ГРУ)
    try {
        const oldCanvas = document.getElementById('draw-canvas');
        if (oldCanvas) oldCanvas.remove();
        const oldToolbar = document.getElementById('drawing-toolbar');
        if (oldToolbar) oldToolbar.remove();
        const oldToggleBtn = document.getElementById('draw-toggle-btn');
        if (oldToggleBtn) oldToggleBtn.remove();
    } catch(e) { console.error("Помилка очищення старих інструментів малювання:", e); }

    // 3. СТВОРЕННЯ ГЛОБАЛЬНОГО ІНТЕРФЕЙСУ
    const drawContainer = document.createElement('div');
    drawContainer.id = 'global-draw-container';
    drawContainer.innerHTML = `
        <style>
            #global-draw-container { font-family: Arial, sans-serif; }
            
            /* ПОЛОТНО ЗА ЗАМОВЧУВАННЯМ ПРОПУСКАЄ ВСІ КЛІКИ */
            #draw-canvas-global { 
                position: fixed; 
                top: 0; left: 0; 
                width: 100vw; height: 100vh; 
                pointer-events: none !important; 
                z-index: 90000; 
                background: transparent;
            }
            
            /* КЛАС АКТИВНОГО МАЛЮВАННЯ (БЛОКУЄ ГРУ ДЛЯ МАЛЮВАННЯ) */
            #draw-canvas-global.is-drawing {
                pointer-events: auto !important;
                touch-action: none !important;
            }

            #toggle-draw-btn-global { 
                position: fixed; bottom: 85px; right: 20px; z-index: 99999; 
                padding: 10px 15px; border-radius: 25px; 
                background-color: #8e44ad; color: white; border: 2px solid white; 
                font-size: 16px; font-weight: bold; cursor: pointer; 
                box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 8px; 
                transition: transform 0.2s; 
            }
            #toggle-draw-btn-global:hover { transform: scale(1.05); }
            
            #draw-panel-global { 
                position: fixed; bottom: 140px; right: 20px; z-index: 99998; 
                background: white; border: 1px solid #ccc; border-radius: 10px; 
                padding: 15px; box-shadow: 0 10px 20px rgba(0,0,0,0.3); 
                width: 250px; display: none; color: #333; 
            }
            #draw-panel-header { 
                display: flex; justify-content: flex-end; align-items: center; 
                margin-bottom: 10px; cursor: grab; padding-bottom: 5px; 
                border-bottom: 1px solid #eee; height: 20px; background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>') no-repeat left center;
            }
            #draw-panel-header:active { cursor: grabbing; }
        </style>
        
        <button id="toggle-draw-btn-global" title="Відкрити панель малювання">✏️ Малювати</button>
        
        <div id="draw-panel-global">
            <div id="draw-panel-header">
                <button id="close-draw-panel-global" style="background: none; border: none; font-size: 16px; cursor: pointer;">❌</button>
            </div>
            <div id="draw-controls-global" style="display: flex; flex-direction: column; gap: 10px;">
                <div style="display: flex; gap: 10px; font-size: 14px;">
                    <label><input type="radio" name="draw-tool-global" value="pencil" checked> ✏️ Олівець</label>
                    <label><input type="radio" name="draw-tool-global" value="eraser"> 🧽 Гумка</label>
                </div>
                <label style="font-size: 14px; font-weight: bold;">Товщина: <span id="size-val-global">4</span>px</label>
                <input type="range" id="draw-size-global" min="1" max="50" value="4">
                <input type="color" id="draw-color-global" value="#e74c3c" style="width: 100%; border: none; height: 35px; cursor: pointer; border-radius: 5px;">
                <button id="draw-clear-btn-global" style="background: #e74c3c; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 5px;">🗑️ Очистити все</button>
            </div>
        </div>
        <canvas id="draw-canvas-global"></canvas>
    `;
    document.body.appendChild(drawContainer);

    const canvas = document.getElementById('draw-canvas-global');
    const ctx = canvas.getContext('2d');
    const drawPanel = document.getElementById('draw-panel-global');
    const toggleDrawBtn = document.getElementById('toggle-draw-btn-global');
    const closeDrawBtn = document.getElementById('close-draw-panel-global');
    const drawSize = document.getElementById('draw-size-global');
    const sizeVal = document.getElementById('size-val-global');
    const drawColor = document.getElementById('draw-color-global');
    const drawClearBtn = document.getElementById('draw-clear-btn-global');
    const toolRadios = document.getElementsByName('draw-tool-global');
    const panelHeader = document.getElementById('draw-panel-header');

    // 4. НАЛАШТУВАННЯ РОЗМІРУ ПОЛОТНА
    function resizeCanvas() {
        const data = canvas.toDataURL();
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); };
        img.src = data;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // 5. ВІДКРИТТЯ ТА ЗАКРИТТЯ МАЛЮВАННЯ (ГОЛОВНИЙ ФІКС)
    toggleDrawBtn.addEventListener('click', () => { 
        drawPanel.style.display = 'block'; 
        toggleDrawBtn.style.display = 'none'; 
        canvas.classList.add('is-drawing'); // Активує малювання
    });
    
    closeDrawBtn.addEventListener('click', () => { 
        drawPanel.style.display = 'none'; 
        toggleDrawBtn.style.display = 'flex'; 
        canvas.classList.remove('is-drawing'); // Вимикає малювання, пропускає кліки в гру
    });

    drawSize.addEventListener('input', (e) => { sizeVal.innerText = e.target.value; });

    let isDrawing = false, lastX = 0, lastY = 0;
    function getTool() { for (let r of toolRadios) { if (r.checked) return r.value; } return 'pencil'; }
    function getEventPos(e) { return (e.touches && e.touches.length > 0) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY }; }

    // 6. ЛОГІКА МАЛЮВАННЯ
    function startDraw(e) {
        if (!canvas.classList.contains('is-drawing')) return;
        isDrawing = true;
        const pos = getEventPos(e);
        lastX = pos.x; lastY = pos.y;
    }

    function draw(e) {
        if (!isDrawing || !canvas.classList.contains('is-drawing')) return;
        e.preventDefault(); 
        const pos = getEventPos(e);
        const tool = getTool(), size = drawSize.value, color = drawColor.value;

        if (typeof db !== 'undefined' && typeof myName !== 'undefined') {
            db.ref('game_action').set({
                senderId: myName, timestamp: Date.now(), type: 'draw_line',
                data: { x0: lastX, y0: lastY, x1: pos.x, y1: pos.y, color: color, size: size, isEraser: tool === 'eraser', w: window.innerWidth, h: window.innerHeight }
            });
        }
        drawLineLocal(lastX, lastY, pos.x, pos.y, color, size, tool === 'eraser');
        lastX = pos.x; lastY = pos.y;
    }
    function stopDraw() { isDrawing = false; }

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw, {passive: false});
    canvas.addEventListener('touchmove', draw, {passive: false});
    window.addEventListener('touchend', stopDraw);

    function drawLineLocal(x0, y0, x1, y1, color, size, isEraser) {
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineWidth = size; ctx.strokeStyle = color;
        ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
        ctx.stroke();
    }

    drawClearBtn.addEventListener('click', () => {
        if (typeof db !== 'undefined' && typeof myName !== 'undefined') {
            db.ref('game_action').set({ senderId: myName, timestamp: Date.now(), type: 'clear_canvas', data: {} });
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // 7. FIREBASE СИНХРОНІЗАЦІЯ
    const checkDbInterval = setInterval(() => {
        if (typeof db !== 'undefined' && typeof myName !== 'undefined') {
            clearInterval(checkDbInterval);
            db.ref('game_action').on('value', snap => {
                const val = snap.val();
                if (!val || val.senderId === myName) return; 
                if (val.type === 'draw_line') {
                    const { x0, y0, x1, y1, color, size, isEraser, w, h } = val.data;
                    drawLineLocal(x0 * (window.innerWidth / w), y0 * (window.innerHeight / h), x1 * (window.innerWidth / w), y1 * (window.innerHeight / h), color, size, isEraser);
                } else if (val.type === 'clear_canvas') {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
        }
    }, 500);

    // 8. ПЕРЕТЯГУВАННЯ ПАНЕЛІ (Draggable)
    let isDraggingPanel = false, panelStartX, panelStartY, initialPanelX, initialPanelY;
    panelHeader.addEventListener('mousedown', (e) => {
        isDraggingPanel = true;
        panelStartX = e.clientX; panelStartY = e.clientY;
        const rect = drawPanel.getBoundingClientRect();
        initialPanelX = rect.left; initialPanelY = rect.top;
        drawPanel.style.right = 'auto'; drawPanel.style.bottom = 'auto';
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDraggingPanel) return;
        const dx = e.clientX - panelStartX;
        const dy = e.clientY - panelStartY;
        drawPanel.style.left = `${initialPanelX + dx}px`;
        drawPanel.style.top = `${initialPanelY + dy}px`;
    });
    window.addEventListener('mouseup', () => { isDraggingPanel = false; });
    
    panelHeader.addEventListener('touchstart', (e) => {
        isDraggingPanel = true;
        panelStartX = e.touches[0].clientX; panelStartY = e.touches[0].clientY;
        const rect = drawPanel.getBoundingClientRect();
        initialPanelX = rect.left; initialPanelY = rect.top;
        drawPanel.style.right = 'auto'; drawPanel.style.bottom = 'auto';
    }, {passive: true});
    window.addEventListener('touchmove', (e) => {
        if (!isDraggingPanel) return;
        const dx = e.touches[0].clientX - panelStartX;
        const dy = e.touches[0].clientY - panelStartY;
        drawPanel.style.left = `${initialPanelX + dx}px`;
        drawPanel.style.top = `${initialPanelY + dy}px`;
    }, {passive: true});
    window.addEventListener('touchend', () => { isDraggingPanel = false; });

})();
