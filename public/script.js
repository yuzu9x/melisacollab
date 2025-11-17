const socket = io("https://yuzu9x.github.io/melisacollab/");

const COOKIE_COUNT = 6;
let currentCookie = 0; // to choose cookie
let drawing = false;
let lastX, lastY;
let currentColor = '#8B4513'; // default icing color
let lineWidth = 3;

// Canvases for each of the cookies
const cookieCanvases = [];
const cookieContexts = [];

function initializeCookies() {
  const tray = document.getElementById('cookie-tray');
  
  for (let i = 0; i < COOKIE_COUNT; i++) {
    const cookieContainer = document.createElement('div');
    cookieContainer.className = 'cookie-container';
    cookieContainer.dataset.cookieId = i;
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    canvas.className = 'cookie-canvas';
    canvas.dataset.cookieId = i;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = currentColor;
    
    cookieContainer.appendChild(canvas);
    tray.appendChild(cookieContainer);
    
    cookieCanvases[i] = canvas;
    cookieContexts[i] = ctx;
    
    setupCanvasListeners(canvas, ctx, i);
  }
  
  // Selecting the cookie
  highlightCookie(0);
}

function setupCanvasListeners(canvas, ctx, cookieId) {
  canvas.addEventListener('mousedown', (e) => {
    currentCookie = cookieId;
    highlightCookie(cookieId);
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseup', () => {
    drawing = false;
  });

  canvas.addEventListener('mouseleave', () => {
    drawing = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawLine(cookieId, lastX, lastY, x, y, currentColor, lineWidth, true);
    lastX = x;
    lastY = y;
  });
}

function highlightCookie(cookieId) {
  document.querySelectorAll('.cookie-container').forEach((container, idx) => {
    container.classList.toggle('active', idx === cookieId);
  });
}

function drawLine(cookieId, x1, y1, x2, y2, color, width, emit) {
  const ctx = cookieContexts[cookieId];
  
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (emit) {
    socket.emit('draw', { cookieId, x1, y1, x2, y2, color, width });
  }
}

// Receive drawing from other users
socket.on('draw', ({ cookieId, x1, y1, x2, y2, color, width }) => {
  drawLine(cookieId, x1, y1, x2, y2, color, width, false);
});

// Loading existing drawings when joining
socket.on('load-drawings', (drawings) => {
  drawings.forEach(({ cookieId, x1, y1, x2, y2, color, width }) => {
    drawLine(cookieId, x1, y1, x2, y2, color, width, false);
  });
});

// Color picker
document.getElementById('color-picker').addEventListener('input', (e) => {
  currentColor = e.target.value;
});

// Brush size
document.getElementById('brush-size').addEventListener('input', (e) => {
  lineWidth = parseInt(e.target.value);
});

// Clear specific cookie
document.getElementById('clear-cookie').addEventListener('click', () => {
  const ctx = cookieContexts[currentCookie];
  ctx.clearRect(0, 0, cookieCanvases[currentCookie].width, cookieCanvases[currentCookie].height);
  socket.emit('clear-cookie', currentCookie);
});

socket.on('clear-cookie', (cookieId) => {
  const ctx = cookieContexts[cookieId];
  ctx.clearRect(0, 0, cookieCanvases[cookieId].width, cookieCanvases[cookieId].height);
});

// Clear all cookies
document.getElementById('clear-all').addEventListener('click', () => {
  cookieContexts.forEach((ctx, i) => {
    ctx.clearRect(0, 0, cookieCanvases[i].width, cookieCanvases[i].height);
  });
  socket.emit('clear-all');
});

socket.on('clear-all', () => {
  cookieContexts.forEach((ctx, i) => {
    ctx.clearRect(0, 0, cookieCanvases[i].width, cookieCanvases[i].height);
  });
});

initializeCookies();