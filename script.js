const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const brushBtn = document.getElementById('brush');
const fillBtn = document.getElementById('fill');
const eraserBtn = document.getElementById('eraser');
const clearBtn = document.getElementById('clear');
const saveBtn = document.getElementById('save');
const themeToggle = document.getElementById('themeToggle');
const sizeValue = document.querySelector('.size-value');
const canvasOverlay = document.querySelector('.canvas-overlay');

// Theme handling
const root = document.documentElement;
const darkTheme = {
    '--primary-color': '#66bb6a',
    '--primary-dark': '#4caf50',
    '--secondary-color': '#42a5f5',
    '--secondary-dark': '#1e88e5',
    '--text-color': '#e0e0e0',
    '--bg-gradient': 'linear-gradient(135deg, #1a237e 0%, #311b92 100%)'
};

const lightTheme = {
    '--primary-color': '#4CAF50',
    '--primary-dark': '#45a049',
    '--secondary-color': '#2196F3',
    '--secondary-dark': '#1976D2',
    '--text-color': '#2c3e50',
    '--bg-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
};

themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? darkTheme : lightTheme;
    Object.entries(theme).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });
});

// Set canvas size
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Initialize canvas
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Drawing state
let isDrawing = false;
let lastX = 0;
let lastY = 0;
let currentTool = 'brush';

// Update size value display
brushSize.addEventListener('input', () => {
    sizeValue.textContent = `${brushSize.value}px`;
});

// Hide overlay on first interaction
canvas.addEventListener('mousedown', () => {
    canvasOverlay.classList.add('hide');
}, { once: true });

// Tool selection
function setActiveTool(tool) {
    currentTool = tool;
    [brushBtn, fillBtn, eraserBtn].forEach(btn => btn.classList.remove('active'));
    switch(tool) {
        case 'brush':
            brushBtn.classList.add('active');
            canvas.style.cursor = 'crosshair';
            break;
        case 'fill':
            fillBtn.classList.add('active');
            canvas.style.cursor = 'pointer';
            break;
        case 'eraser':
            eraserBtn.classList.add('active');
            canvas.style.cursor = 'crosshair';
            break;
    }
}

// Flood fill implementation
function getPixel(imageData, x, y) {
    if (x < 0 || y < 0 || x >= imageData.width || y >= imageData.height) {
        return [-1, -1, -1, -1];  // Invalid color
    }
    const offset = (y * imageData.width + x) * 4;
    return imageData.data.slice(offset, offset + 4);
}

function colorsMatch(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function floodFill(startX, startY, fillColor) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const targetColor = getPixel(imageData, startX, startY);
    
    // Convert hex color to RGBA
    ctx.fillStyle = fillColor;
    const dummyCanvas = document.createElement('canvas');
    const dummyCtx = dummyCanvas.getContext('2d');
    dummyCtx.fillStyle = fillColor;
    dummyCtx.fillRect(0, 0, 1, 1);
    const newColor = dummyCtx.getImageData(0, 0, 1, 1).data;

    if (colorsMatch(targetColor, Array.from(newColor))) {
        return; // Same color, no need to fill
    }

    const pixelsToCheck = [[startX, startY]];
    while (pixelsToCheck.length > 0) {
        const [x, y] = pixelsToCheck.pop();
        const currentColor = getPixel(imageData, x, y);

        if (!colorsMatch(currentColor, targetColor)) {
            continue;
        }

        const offset = (y * imageData.width + x) * 4;
        imageData.data[offset] = newColor[0];
        imageData.data[offset + 1] = newColor[1];
        imageData.data[offset + 2] = newColor[2];
        imageData.data[offset + 3] = newColor[3];

        pixelsToCheck.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
}

// Event listeners for drawing
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Touch support
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('touchmove', handleTouch);
canvas.addEventListener('touchend', stopDrawing);

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function startDrawing(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (currentTool === 'fill') {
        floodFill(Math.floor(x), Math.floor(y), colorPicker.value);
        return;
    }

    isDrawing = true;
    [lastX, lastY] = [x, y];
}

function draw(e) {
    if (!isDrawing || currentTool === 'fill') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : colorPicker.value;
    ctx.lineWidth = brushSize.value;
    ctx.lineCap = 'round';
    ctx.stroke();

    [lastX, lastY] = [x, y];
}

function stopDrawing() {
    isDrawing = false;
}

// Tool functionality
brushBtn.addEventListener('click', () => setActiveTool('brush'));
fillBtn.addEventListener('click', () => setActiveTool('fill'));
eraserBtn.addEventListener('click', () => setActiveTool('eraser'));

clearBtn.addEventListener('click', () => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    canvasOverlay.classList.remove('hide');
});

saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'my-artwork.png';
    link.href = canvas.toDataURL();
    link.click();
}); 