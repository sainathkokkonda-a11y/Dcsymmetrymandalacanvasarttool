const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');

const PREVIEW_SIZE = 450;
let isDrawing = false;
let strokePaths = [];
let rainbowHue = 0;

const brushColorInput = document.getElementById('brushColor');
const colorModeSelect = document.getElementById('colorMode');
const solidColorGroup = document.getElementById('solidColorGroup');
const brushSizeInput = document.getElementById('brushSize');
const sizeVal = document.getElementById('sizeVal');
const symmetryPointsSelect = document.getElementById('symmetryPoints');
const canvasThemeSelect = document.getElementById('canvasTheme');
const lineStyleSelect = document.getElementById('lineStyle');
const exportResolutionSelect = document.getElementById('exportResolution');

const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');

function initCanvas() {
    ctx.fillStyle = canvasThemeSelect.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokePaths = [];
}

colorModeSelect.addEventListener('change', () => {
    if (colorModeSelect.value === 'solid') {
        solidColorGroup.style.display = 'flex';
    } else {
        solidColorGroup.style.display = 'none';
    }
});

canvasThemeSelect.addEventListener('change', () => {
    redrawCanvas();
});

brushSizeInput.addEventListener('input', (e) => {
    sizeVal.textContent = e.target.value;
});

function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

let lastX = 0, lastY = 0;

function startDraw(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
}

function draw(e) {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    const currentX = pos.x;
    const currentY = pos.y;

    let strokeColor = brushColorInput.value;
    const colorMode = colorModeSelect.value;

    if (colorMode === 'rainbow') {
        rainbowHue = (rainbowHue + 4) % 360;
        strokeColor = `hsl(${rainbowHue}, 100%, 50%)`;
    } else if (colorMode === 'neon') {
        strokeColor = '#00ffff'; 
    }

    const strokeData = {
        x1: lastX, y1: lastY,
        x2: currentX, y2: currentY,
        color: strokeColor,
        colorMode: colorMode,
        size: parseInt(brushSizeInput.value),
        symmetry: parseInt(symmetryPointsSelect.value),
        lineStyle: lineStyleSelect.value
    };

    strokePaths.push(strokeData);
    renderStroke(ctx, strokeData, PREVIEW_SIZE);

    lastX = currentX;
    lastY = currentY;
}

function renderStroke(targetCtx, stroke, canvasSize) {
    const scale = canvasSize / PREVIEW_SIZE;
    const cx = canvasSize / 2;
    const cy = canvasSize / 2;
    const angleStep = (Math.PI * 2) / stroke.symmetry;

    targetCtx.strokeStyle = stroke.color;
    targetCtx.lineWidth = stroke.size * scale;
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    targetCtx.setLineDash([]);

    const scaledSize = stroke.size * scale;
    if (stroke.lineStyle === 'dotted') {
        targetCtx.setLineDash([scaledSize * 1.5, scaledSize * 1.5]);
    } else if (stroke.lineStyle === 'dashed') {
        targetCtx.setLineDash([scaledSize * 4, scaledSize * 2]);
    }

    if (stroke.colorMode === 'neon') {
        targetCtx.shadowColor = stroke.color;
        targetCtx.shadowBlur = scaledSize * 4;
    } else {
        targetCtx.shadowBlur = 0;
    }

    const x1_offset = (stroke.x1 * scale) - cx;
    const y1_offset = (stroke.y1 * scale) - cy;
    const x2_offset = (stroke.x2 * scale) - cx;
    const y2_offset = (stroke.y2 * scale) - cy;

    targetCtx.save();
    targetCtx.translate(cx, cy);

    for (let i = 0; i < stroke.symmetry; i++) {
        targetCtx.save();
        targetCtx.rotate(i * angleStep);
        
        targetCtx.beginPath();
        targetCtx.moveTo(x1_offset, y1_offset);
        targetCtx.lineTo(x2_offset, y2_offset);
        targetCtx.stroke();

        if (stroke.lineStyle === 'double') {
            targetCtx.beginPath();
            targetCtx.moveTo(x1_offset + scaledSize, y1_offset + scaledSize);
            targetCtx.lineTo(x2_offset + scaledSize, y2_offset + scaledSize);
            targetCtx.stroke();
        }

        targetCtx.beginPath();
        targetCtx.moveTo(x1_offset, -y1_offset);
        targetCtx.lineTo(x2_offset, -y2_offset);
        targetCtx.stroke();

        if (stroke.lineStyle === 'double') {
            targetCtx.beginPath();
            targetCtx.moveTo(x1_offset + scaledSize, -y1_offset - scaledSize);
            targetCtx.lineTo(x2_offset + scaledSize, -y2_offset - scaledSize);
            targetCtx.stroke();
        }

        targetCtx.restore();
    }

    targetCtx.restore();
    targetCtx.shadowBlur = 0;
}

function redrawCanvas() {
    ctx.fillStyle = canvasThemeSelect.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokePaths.forEach(stroke => {
        renderStroke(ctx, stroke, PREVIEW_SIZE);
    });
}

function stopDraw() {
    if (isDrawing) {
        isDrawing = false;
    }
}

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDraw);
canvas.addEventListener('mouseout', stopDraw);

canvas.addEventListener('touchstart', (e) => { startDraw(e); e.preventDefault(); });
canvas.addEventListener('touchmove', (e) => { draw(e); e.preventDefault(); });
canvas.addEventListener('touchend', (e) => { stopDraw(); e.preventDefault(); });

undoBtn.addEventListener('click', () => {
    if (strokePaths.length > 0) {
        strokePaths.splice(-5); 
        redrawCanvas();
    }
});

clearBtn.addEventListener('click', () => {
    initCanvas();
});

downloadBtn.addEventListener('click', () => {
    const resValue = parseInt(exportResolutionSelect.value);
    
    const highResCanvas = document.createElement('canvas');
    highResCanvas.width = resValue;
    highResCanvas.height = resValue;
    const hCtx = highResCanvas.getContext('2d');
    
    hCtx.fillStyle = canvasThemeSelect.value;
    hCtx.fillRect(0, 0, resValue, resValue);
    
    hCtx.imageSmoothingEnabled = true;
    hCtx.imageSmoothingQuality = 'high';

    strokePaths.forEach(stroke => {
        renderStroke(hCtx, stroke, resValue);
    });

    const link = document.createElement('a');
    link.download = `mandala-artwork-${resValue}px.png`;
    link.href = highResCanvas.toDataURL('image/png', 1.0);
    link.click();
});

initCanvas();
